-- ============================================================
-- instantTools 埋点数据表结构
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 1. 创建访问记录表
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  ts BIGINT NOT NULL,
  duration BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.1 若你已执行过旧版建表（无 device_type/browser 列），先执行下面的迁移语句
-- ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS device_type TEXT;
-- ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS browser TEXT;

-- 2. 创建索引加速查询（按时间、工具、访客聚合）
CREATE INDEX IF NOT EXISTS idx_visits_ts ON public.visits (ts DESC);
CREATE INDEX IF NOT EXISTS idx_visits_tool_id ON public.visits (tool_id);
CREATE INDEX IF NOT EXISTS idx_visits_session ON public.visits (session_id);
CREATE INDEX IF NOT EXISTS idx_visits_session_tool_ts ON public.visits (session_id, tool_id, ts);

-- 3. 开启行级安全 (RLS)
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 4. 策略：允许匿名插入访问记录（埋点写入）
CREATE POLICY "允许匿名插入访问记录"
  ON public.visits FOR INSERT TO anon WITH CHECK (true);

-- 5. 策略：允许匿名更新 duration（离开工具时更新停留时长）
CREATE POLICY "允许匿名更新访问记录时长"
  ON public.visits FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 6. 策略：允许匿名读取（监控页面查询全局数据）
--    注意：若你只想自己查看全局数据，删除此策略，
--    改为在 /control 页面加密码验证后，用 service_role key 查询
CREATE POLICY "允许匿名读取访问记录"
  ON public.visits FOR SELECT TO anon USING (true);
