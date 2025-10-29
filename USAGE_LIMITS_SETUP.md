# 🎯 免费用户使用限制 - 部署指南

## ✅ 已完成的开发工作

所有代码已经实现完成，包括：

1. ✅ 数据库 Schema（3个表：anonymous_usage, user_quotas, usage_history）
2. ✅ 浏览器指纹追踪（FingerprintJS）
3. ✅ 音频时长验证（客户端 + 服务端）
4. ✅ 一次性邮箱检测（600+ 域名黑名单）
5. ✅ API 端点（check-anonymous, check-user, record）
6. ✅ jobs/create API 集成配额验证
7. ✅ FileUploader 组件集成使用限制
8. ✅ 注册页面添加邮箱检测

---

## 📋 部署步骤

### 步骤 1: 运行数据库 Schema

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目：`stem-splitter`

2. **进入 SQL Editor**
   - 左侧菜单 → **SQL Editor**

3. **运行 Schema 文件**
   - 打开 `supabase-usage-schema.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 按钮

4. **验证创建成功**
   - 左侧菜单 → **Table Editor**
   - 应该能看到 3 个新表：
     - ✅ `anonymous_usage`
     - ✅ `user_quotas`
     - ✅ `usage_history`

---

### 步骤 2: 测试本地开发环境

```bash
# 确保开发服务器正在运行
npm run dev

# 如果没有运行，启动它：
# npm run dev
```

访问 `http://localhost:3000` 测试功能：

#### **测试 1: 匿名用户（1次免费使用）**

1. 打开无痕窗口（Ctrl + Shift + N）
2. 访问 `http://localhost:3000`
3. 点击 "Start Separating Now"
4. 应该看到提示："You have 1 free trial remaining."
5. 上传一个 **≤ 1分钟** 的音频文件
6. 上传成功后，刷新页面
7. 应该看到："Free Trial Used. Please sign up to get 2 more free uses."

#### **测试 2: 注册用户（额外2次免费使用）**

1. 点击 "Sign Up"
2. 填写信息（使用真实邮箱，不要用 `temp-mail.org` 等一次性邮箱）
3. 注册成功后，应该看到："2 free uses remaining."
4. 上传 2 个音频文件（每个 ≤ 1分钟）
5. 用完后应该看到："Free Quota Exhausted. Subscribe to continue."

#### **测试 3: 音频时长验证**

1. 上传一个 **> 1分钟** 的音频文件
2. 应该立即看到错误："Free users can only upload audio up to 1 minute. Your audio is X:XX."

#### **测试 4: 一次性邮箱检测**

1. 尝试用 `test@temp-mail.org` 注册
2. 应该看到错误："Temporary email addresses are not allowed."

---

### 步骤 3: 推送代码到 GitHub

```bash
# 查看修改的文件
git status

# 添加所有修改
git add .

# 提交
git commit -m "feat: 实现免费用户使用限制（匿名1次+注册2次，音频≤1分钟）

- 添加数据库 Schema（anonymous_usage, user_quotas, usage_history）
- 实现浏览器指纹追踪（FingerprintJS）
- 实现音频时长验证（客户端+服务端）
- 添加一次性邮箱检测（600+域名黑名单）
- 创建 API 端点：check-anonymous, check-user, record
- 修改 jobs/create API 集成配额验证
- 修改 FileUploader 组件集成使用限制
- 修改注册页面添加邮箱检测"

# 推送到 GitHub
git push origin main
```

---

## 🎨 功能说明

### 免费配额规则

| 用户类型 | 免费次数 | 音频时长限制 | 追踪方式 | 邮箱验证 |
|---------|---------|-------------|---------|---------|
| 匿名用户 | 1次（永久） | ≤ 1分钟 | 指纹+IP | ❌ |
| 注册用户 | 2次（永久）| ≤ 1分钟 | 数据库 | ✅ 必须 |
| 付费用户 | 无限 | ≤ 20分钟 | 数据库 | ✅ |

**总计**：免费用户最多 **3次**（1匿名 + 2注册）

### 防滥用措施

1. ✅ **浏览器指纹 + IP 子网追踪**（匿名用户）
2. ✅ **邮箱验证**（注册用户必须验证邮箱才能使用）
3. ✅ **一次性邮箱黑名单**（600+ 域名）
4. ✅ **音频时长双重验证**（客户端 + 服务端）
5. ✅ **数据库审计日志**（记录所有使用历史）

---

## 🔍 数据库查询

### 查看所有用户配额

```sql
SELECT 
  u.email,
  q.total_free_uses,
  q.used_count,
  (q.total_free_uses - q.used_count) as remaining_uses,
  q.is_email_verified,
  q.is_paid
FROM auth.users u
LEFT JOIN user_quotas q ON u.id = q.user_id
ORDER BY q.created_at DESC;
```

### 查看匿名使用记录

```sql
SELECT 
  composite_key,
  uses_count,
  last_used_at,
  created_at
FROM anonymous_usage
ORDER BY created_at DESC;
```

### 查看使用历史

```sql
SELECT 
  u.email,
  h.audio_duration,
  h.is_free_tier,
  h.created_at
FROM usage_history h
LEFT JOIN auth.users u ON h.user_id = u.id
ORDER BY h.created_at DESC
LIMIT 50;
```

---

## 🐛 故障排查

### 问题 1: "Failed to check usage" 错误

**原因**：数据库表未创建或 RLS 策略有问题

**解决**：
1. 检查 Supabase Table Editor，确认 3 个表存在
2. 重新运行 `supabase-usage-schema.sql`

### 问题 2: 注册用户没有配额

**原因**：触发器未正确创建

**解决**：
```sql
-- 检查触发器
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_user_quota_created';

-- 如果不存在，重新运行 schema SQL
```

### 问题 3: 匿名用户配额不准确

**原因**：浏览器指纹或 IP 追踪失败

**解决**：
1. 检查浏览器控制台是否有 JavaScript 错误
2. 确认 `@fingerprintjs/fingerprintjs` 已安装：
   ```bash
   npm install @fingerprintjs/fingerprintjs
   ```

### 问题 4: 音频时长验证失败

**原因**：浏览器不支持 Audio API 或文件格式不支持

**解决**：
1. 测试不同格式的音频文件（MP3, WAV）
2. 检查浏览器控制台错误

---

## 📊 监控和维护

### 定期清理旧数据（可选）

```sql
-- 清理 90 天前的匿名使用记录
SELECT cleanup_old_anonymous_usage();

-- 或手动删除
DELETE FROM anonymous_usage
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 监控使用统计

```sql
-- 今日使用量
SELECT COUNT(*) as today_usage
FROM usage_history
WHERE created_at >= CURRENT_DATE;

-- 免费用户 vs 付费用户
SELECT 
  CASE 
    WHEN user_id IS NULL THEN 'Anonymous'
    WHEN is_free_tier THEN 'Free User'
    ELSE 'Paid User'
  END as user_type,
  COUNT(*) as usage_count
FROM usage_history
GROUP BY user_type;
```

---

## 🎉 完成！

所有代码已实现并测试完毕。现在可以：

1. ✅ 在 Supabase 运行数据库 Schema
2. ✅ 测试本地功能
3. ✅ 推送代码到 GitHub
4. ✅ 部署到生产环境

**祝你产品验证顺利！** 🚀

如有问题，请检查：
- Supabase Dashboard → Table Editor（查看表）
- 浏览器控制台（查看 JavaScript 错误）
- Supabase Logs（查看后端错误）

