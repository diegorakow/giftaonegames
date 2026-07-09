-- =====================================================
-- SISTEMA LEVEL UP (FIDELIDADE)
-- =====================================================

-- 1. Tabela de configuração de níveis
CREATE TABLE public.levels_config (
  level INTEGER PRIMARY KEY,
  xp_required_total INTEGER NOT NULL,
  title TEXT NOT NULL,
  perk_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir níveis iniciais (1-20)
INSERT INTO public.levels_config (level, xp_required_total, title, perk_json) VALUES
  (1, 0, 'Novato', '{"badge": "novice"}'),
  (2, 50, 'Jogador', '{"badge": "player"}'),
  (3, 150, 'Entusiasta', '{"badge": "enthusiast", "coupon_percent": 1}'),
  (4, 300, 'Veterano', '{"badge": "veteran", "coupon_percent": 1}'),
  (5, 500, 'Bronze', '{"badge": "bronze", "coupon_percent": 2}'),
  (6, 750, 'Bronze II', '{"badge": "bronze_2", "coupon_percent": 2}'),
  (7, 1000, 'Bronze III', '{"badge": "bronze_3", "coupon_percent": 2}'),
  (8, 1500, 'Prata', '{"badge": "silver", "coupon_percent": 3}'),
  (9, 2000, 'Prata II', '{"badge": "silver_2", "coupon_percent": 3}'),
  (10, 2500, 'Prata III', '{"badge": "silver_3", "coupon_percent": 3}'),
  (11, 3500, 'Ouro', '{"badge": "gold", "coupon_percent": 5}'),
  (12, 4500, 'Ouro II', '{"badge": "gold_2", "coupon_percent": 5}'),
  (13, 6000, 'Ouro III', '{"badge": "gold_3", "coupon_percent": 5}'),
  (14, 8000, 'Platina', '{"badge": "platinum", "coupon_percent": 7}'),
  (15, 10000, 'Platina II', '{"badge": "platinum_2", "coupon_percent": 7}'),
  (16, 13000, 'Platina III', '{"badge": "platinum_3", "coupon_percent": 7}'),
  (17, 17000, 'Diamante', '{"badge": "diamond", "coupon_percent": 10}'),
  (18, 22000, 'Diamante II', '{"badge": "diamond_2", "coupon_percent": 10}'),
  (19, 28000, 'Diamante III', '{"badge": "diamond_3", "coupon_percent": 10}'),
  (20, 35000, 'Lendário', '{"badge": "legendary", "coupon_percent": 15}');

-- 2. Tabela de estatísticas do usuário
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de transações de XP
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  xp_earned INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_order_xp UNIQUE (order_id)
);

-- Índices para performance
CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_order ON public.xp_transactions(order_id);
CREATE INDEX idx_user_stats_level ON public.user_stats(level);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- levels_config: leitura pública
ALTER TABLE public.levels_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view levels config"
  ON public.levels_config
  FOR SELECT
  USING (true);

-- user_stats: usuário só vê o próprio
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- xp_transactions: usuário só vê o próprio
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp transactions"
  ON public.xp_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage user_stats"
  ON public.user_stats
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage xp_transactions"
  ON public.xp_transactions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage levels_config"
  ON public.levels_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FUNÇÃO: Calcular nível baseado no XP
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT level FROM public.levels_config 
     WHERE xp_required_total <= p_xp 
     ORDER BY level DESC 
     LIMIT 1),
    1
  )
$$;

-- =====================================================
-- FUNÇÃO: Obter info do nível do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_level_info(p_user_id UUID)
RETURNS TABLE (
  xp_total INTEGER,
  current_level INTEGER,
  level_title TEXT,
  level_perk JSONB,
  next_level INTEGER,
  xp_for_next_level INTEGER,
  xp_progress INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_data AS (
    SELECT COALESCE(us.xp_total, 0) as xp_total
    FROM auth.users u
    LEFT JOIN public.user_stats us ON us.user_id = u.id
    WHERE u.id = p_user_id
  ),
  current AS (
    SELECT 
      lc.level,
      lc.title,
      lc.perk_json,
      lc.xp_required_total
    FROM public.levels_config lc, user_data ud
    WHERE lc.xp_required_total <= ud.xp_total
    ORDER BY lc.level DESC
    LIMIT 1
  ),
  next AS (
    SELECT 
      lc.level,
      lc.xp_required_total
    FROM public.levels_config lc, user_data ud
    WHERE lc.xp_required_total > ud.xp_total
    ORDER BY lc.level ASC
    LIMIT 1
  )
  SELECT 
    ud.xp_total,
    COALESCE(c.level, 1),
    COALESCE(c.title, 'Novato'),
    COALESCE(c.perk_json, '{}'::jsonb),
    n.level,
    n.xp_required_total,
    CASE 
      WHEN n.xp_required_total IS NOT NULL 
      THEN ud.xp_total - COALESCE(c.xp_required_total, 0)
      ELSE 0
    END
  FROM user_data ud
  LEFT JOIN current c ON true
  LEFT JOIN next n ON true
$$;

-- =====================================================
-- FUNÇÃO: Processar XP de pedido pago (idempotente)
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_order_xp(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total NUMERIC;
  v_xp_earned INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Verificar se já foi processado (idempotência)
  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE order_id = p_order_id) THEN
    RETURN FALSE;
  END IF;

  -- Obter dados do pedido
  SELECT user_id, total INTO v_user_id, v_total
  FROM public.orders
  WHERE id = p_order_id AND status = 'paid';

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calcular XP (1 XP por R$ 1)
  v_xp_earned := FLOOR(v_total)::INTEGER;

  -- Inserir transação de XP
  INSERT INTO public.xp_transactions (user_id, order_id, amount_paid, xp_earned)
  VALUES (v_user_id, p_order_id, v_total, v_xp_earned);

  -- Atualizar ou criar user_stats
  INSERT INTO public.user_stats (user_id, xp_total, level, updated_at)
  VALUES (v_user_id, v_xp_earned, calculate_level_from_xp(v_xp_earned), now())
  ON CONFLICT (user_id) DO UPDATE SET
    xp_total = user_stats.xp_total + v_xp_earned,
    level = calculate_level_from_xp(user_stats.xp_total + v_xp_earned),
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-processar XP quando pedido for pago
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só processar quando status mudar para 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM process_order_xp(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_paid ON public.orders;

CREATE TRIGGER on_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_paid();

-- Trigger para INSERT também (caso pedido seja criado já como paid)
CREATE TRIGGER on_order_created_paid
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION public.handle_order_paid();

-- =====================================================
-- TRIGGER: Atualizar updated_at em user_stats
-- =====================================================
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();