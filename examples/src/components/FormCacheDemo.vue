<template>
  <div class="demo-section">
    <h2>📝 表单自动保存演示</h2>
    <p class="description">
      表单数据会自动保存到缓存中，即使刷新页面也不会丢失。非常适合长表单或草稿功能。
    </p>

    <div class="form-container">
      <div class="form-header">
        <h3>用户注册表单</h3>
        <div class="auto-save-indicator" :class="{ saving: isSaving, saved: justSaved }">
          <span v-if="isSaving">保存中...</span>
          <span v-else-if="justSaved">✓ 已保存</span>
          <span v-else>自动保存已启用</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="username">用户名 *</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            class="input"
            @input="onFormChange"
          />
        </div>

        <div class="form-group">
          <label for="email">邮箱 *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="input"
            @input="onFormChange"
          />
        </div>

        <div class="form-group">
          <label for="phone">电话</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            class="input"
            @input="onFormChange"
          />
        </div>

        <div class="form-group">
          <label for="address">地址</label>
          <textarea
            id="address"
            v-model="formData.address"
            rows="3"
            class="input"
            @input="onFormChange"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="interests">兴趣爱好</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="formData.interests"
                type="checkbox"
                value="reading"
                @change="onFormChange"
              />
              阅读
            </label>
            <label class="checkbox-label">
              <input
                v-model="formData.interests"
                type="checkbox"
                value="coding"
                @change="onFormChange"
              />
              编程
            </label>
            <label class="checkbox-label">
              <input
                v-model="formData.interests"
                type="checkbox"
                value="sports"
                @change="onFormChange"
              />
              运动
            </label>
            <label class="checkbox-label">
              <input
                v-model="formData.interests"
                type="checkbox"
                value="music"
                @change="onFormChange"
              />
              音乐
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea
            id="bio"
            v-model="formData.bio"
            rows="5"
            placeholder="介绍一下你自己..."
            class="input"
            @input="onFormChange"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg">
            提交表单
          </button>
          <button type="button" @click="clearForm" class="btn btn-warning">
            清空表单
          </button>
          <button type="button" @click="loadSample" class="btn btn-info">
            加载示例数据
          </button>
        </div>

        <div class="form-stats">
          <p><strong>最后保存时间:</strong> {{ lastSaveTime || '未保存' }}</p>
          <p><strong>已填写字段:</strong> {{ filledFieldsCount }} / {{ totalFields }}</p>
          <p><strong>完成度:</strong> {{ completionPercentage }}%</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { createCache } from '@ldesign/cache'

interface FormData {
  username: string
  email: string
  phone: string
  address: string
  interests: string[]
  bio: string
}

const cache = createCache({
  defaultEngine: 'localStorage',
  keyPrefix: 'form_demo_',
})

const FORM_CACHE_KEY = 'user_registration_form'
const AUTO_SAVE_DELAY = 1000 // 1秒后自动保存

// 状态
const formData = reactive<FormData>({
  username: '',
  email: '',
  phone: '',
  address: '',
  interests: [],
  bio: '',
})

const isSaving = ref(false)
const justSaved = ref(false)
const lastSaveTime = ref<string>('')
let autoSaveTimer: number | null = null

// 计算属性
const totalFields = computed(() => {
  return 6 // 总字段数
})

const filledFieldsCount = computed(() => {
  let count = 0
  if (formData.username) count++
  if (formData.email) count++
  if (formData.phone) count++
  if (formData.address) count++
  if (formData.interests.length > 0) count++
  if (formData.bio) count++
  return count
})

const completionPercentage = computed(() => {
  return Math.round((filledFieldsCount.value / totalFields.value) * 100)
})

// 方法
const onFormChange = () => {
  // 防抖保存
  if (autoSaveTimer !== null) {
    clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = setTimeout(() => {
    saveForm()
  }, AUTO_SAVE_DELAY) as unknown as number
}

const saveForm = async () => {
  isSaving.value = true
  justSaved.value = false

  try {
    await cache.set(FORM_CACHE_KEY, formData, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 保存7天
    })

    const now = new Date()
    lastSaveTime.value = now.toLocaleString('zh-CN')

    justSaved.value = true
    setTimeout(() => {
      justSaved.value = false
    }, 2000)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    isSaving.value = false
  }
}

const loadForm = async () => {
  try {
    const saved = await cache.get<FormData>(FORM_CACHE_KEY)
    if (saved) {
      Object.assign(formData, saved)
      console.log('表单数据已恢复')
    }
  } catch (error) {
    console.error('加载失败:', error)
  }
}

const clearForm = async () => {
  if (!confirm('确定要清空表单吗？此操作不可恢复。')) {
    return
  }

  formData.username = ''
  formData.email = ''
  formData.phone = ''
  formData.address = ''
  formData.interests = []
  formData.bio = ''

  await cache.remove(FORM_CACHE_KEY)
  lastSaveTime.value = ''
  alert('表单已清空')
}

const loadSample = () => {
  formData.username = 'zhangsan'
  formData.email = 'zhangsan@example.com'
  formData.phone = '13800138000'
  formData.address = '北京市朝阳区xxx街道xxx号'
  formData.interests = ['reading', 'coding']
  formData.bio = '这是一段示例个人简介。我喜欢阅读和编程，希望通过技术改变世界。'

  onFormChange()
}

const handleSubmit = async () => {
  // 先保存
  await saveForm()

  // 模拟提交
  alert(`表单提交成功！\n\n数据:\n${JSON.stringify(formData, null, 2)}`)

  // 提交成功后清除缓存
  await cache.remove(FORM_CACHE_KEY)
  lastSaveTime.value = ''
}

// 生命周期
onMounted(async () => {
  await loadForm()
})

onUnmounted(() => {
  if (autoSaveTimer !== null) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style scoped>
.demo-section {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #3c8772;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.form-container {
  max-width: 600px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #eee;
}

.form-header h3 {
  margin: 0;
  color: #333;
}

.auto-save-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f0f0;
  color: #666;
  transition: all 0.3s;
}

.auto-save-indicator.saving {
  background: #fff3cd;
  color: #856404;
}

.auto-save-indicator.saved {
  background: #d4edda;
  color: #155724;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #3c8772;
  box-shadow: 0 0 0 3px rgba(60, 135, 114, 0.1);
}

textarea.input {
  resize: vertical;
  min-height: 80px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-lg {
  padding: 10px 24px;
  font-size: 16px;
}

.btn-primary {
  background: #3c8772;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.form-stats {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #3c8772;
}

.form-stats p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.form-stats strong {
  color: #333;
}
</style>

