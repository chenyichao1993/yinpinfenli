# 🔑 环境变量配置指南

## ⚠️ 重要提示

你的 API 目前返回 **500 错误**，因为缺少 `SUPABASE_SERVICE_ROLE_KEY` 环境变量。按照以下步骤配置：

---

## 📋 配置步骤

### 步骤 1: 获取 Supabase Service Role Key

1. 打开 **Supabase Dashboard**：https://supabase.com/dashboard
2. 选择你的项目：`stem-splitter`
3. 点击左侧 **⚙️ Project Settings**
4. 点击 **API** 标签
5. 找到 **Project API keys** 部分
6. 复制 **`service_role`** key（⚠️ 不是 `anon` key！）

**示例：**
```
service_role key (secret):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2Nzg4MDAwMDAsImV4cCI6MTk5NDM3NjAwMH0...
```

---

### 步骤 2: 创建 `.env.local` 文件

1. 在项目根目录（`D:\CursorTest\yinpinfenli\`）创建文件：`.env.local`

2. 添加以下内容：

```bash
# ============================================
# 公开变量（客户端可访问）
# ============================================

# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key（公开密钥）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# 私密变量（仅服务端使用）⚠️
# ============================================

# Supabase Service Role Key（完全权限）
# ⚠️ 警告：此 key 拥有完全数据库权限，切勿泄露！
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. 将 `your-project-id` 和密钥替换为你的真实值

---

### 步骤 3: 重启开发服务器

**在 Terminal 中：**

```bash
# 停止当前服务器（Ctrl + C）
# 然后重新启动：
npm run dev
```

---

### 步骤 4: 验证配置

1. 刷新浏览器：`http://localhost:3000`
2. 打开开发者工具（F12）→ Console 标签
3. 应该**不再有** 500 错误
4. 应该看到**蓝色横幅**："1 free use remaining"

---

## ✅ 完整的 `.env.local` 示例

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://vanttrqbbsvwqsrilmoo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbnR0cnFiYnN2d3Fzcmlsbm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2MTY2NzIsImV4cCI6MjAyNTE5MjY3Mn0.xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbnR0cnFiYnN2d3Fzcmlsbm9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTYxNjY3MiwiZXhwIjoyMDI1MTkyNjcyfQ.yyy

# Gaudiolab 配置
GAUDIOLAB_API_KEY=your-gaudiolab-key
```

---

## 🔍 故障排查

### 问题 1: 仍然显示 500 错误

**原因**：环境变量未加载

**解决**：
1. 确认 `.env.local` 文件在项目根目录
2. 确认文件内容正确（没有多余空格）
3. **完全重启开发服务器**（Ctrl + C 停止，然后 `npm run dev`）

### 问题 2: "Missing env.SUPABASE_SERVICE_ROLE_KEY" 错误

**原因**：`.env.local` 文件不存在或变量名拼写错误

**解决**：
1. 检查文件名是否为 `.env.local`（注意前面的点）
2. 检查变量名是否完全匹配：`SUPABASE_SERVICE_ROLE_KEY`

### 问题 3: "Invalid JWT" 错误

**原因**：Service Role Key 复制错误或过期

**解决**：
1. 重新从 Supabase Dashboard 复制 service_role key
2. 确保复制的是**完整的** JWT token（以 `eyJ` 开头）

---

## 🎉 配置成功后

你应该看到：

1. ✅ 控制台**无 500 错误**
2. ✅ 蓝色信息横幅："**1 free use remaining**"
3. ✅ 橙色警告图标消失
4. ✅ 可以正常上传音频文件

---

## 📚 相关文档

- [Supabase API Keys 文档](https://supabase.com/docs/guides/api/api-keys)
- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🔐 安全提醒

1. ⚠️ **切勿将 `.env.local` 提交到 Git**（已在 `.gitignore` 中排除）
2. ⚠️ **切勿分享或公开 `SUPABASE_SERVICE_ROLE_KEY`**
3. ⚠️ 如果泄露，立即在 Supabase Dashboard 中重置密钥

---

**配置完成后，请告诉我结果！** 🚀

