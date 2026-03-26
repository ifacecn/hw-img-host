import express from 'express'
import { uploadToCnb, createProxyHandler, listCnbFiles, deleteCnbFile } from './_utils'
import { reply } from './_reply'
import multer from 'multer'
const upload = multer()
const app = express()

const requestConfig = {
  responseType: 'arraybuffer',
  timeout: 5000,
  headers: {
    Accept: 'image/*, */*',
    'User-Agent': 'SeerImageProxy/1.0 (+https://seerinfo.yuyuqaq.cn)',
  },
}
const BASE_URL = 'https://cnb.cool/' + process.env.SLUG_IMG + '/-/imgs/'

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on Node Functions!' })
})

app.get('/img/*path', createProxyHandler(BASE_URL, requestConfig))

app.post(
  '/upload/img',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      if (!files || !files.file) {
        return res.status(400).json(reply(1, '未上传文件', ''))
      }

      const mainFile = files.file?.[0]
      const thumbnailFile = files.thumbnail?.[0]

      // 上传主图
      const mainResult = await uploadToCnb({
        fileBuffer: mainFile.buffer,
        fileName: mainFile.originalname,
      })

      const baseUrl = process.env.BASE_IMG_URL

      const mainImgPath = extractImagePath(mainResult.url)
      const mainUrl = baseUrl + 'api/img/' + mainImgPath

      let thumbnailUrl = null
      let thumbnailAssets = null

      // 上传缩略图
      if (thumbnailFile) {
        const thumbnailResult = await uploadToCnb({
          fileBuffer: thumbnailFile.buffer,
          fileName: thumbnailFile.originalname,
        })

        const thumbnailImgPath = extractImagePath(thumbnailResult.url)
        thumbnailUrl = baseUrl + 'api/img/' + thumbnailImgPath
        thumbnailAssets = thumbnailResult.assets
      }

      res.json(
        reply(0, '上传成功', {
          url: mainUrl,
          thumbnailUrl: thumbnailUrl,
          assets: mainResult.assets,
          thumbnailAssets: thumbnailAssets,
          hasThumbnail: !!thumbnailFile,
        }),
      )
    } catch (err) {
      console.error('上传失败:', err.response?.data || err.message)
      res.status(500).json(reply(1, '上传失败', err.message))
    }
  },
)

/**
 * 从 URL 中提取图片路径
 * @param {string} url - 完整的 URL
 * @returns {string} - 提取的图片路径
 */
function extractImagePath(url) {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  return url
}

// ========== 管理功能 API ==========

// 管理密码验证
app.post('/admin/login', (req, res) => {
  const { password } = req.body
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  if (password === adminPassword) {
    // 生成简单的 token（基于密码 + 时间戳的 hash）
    const token = Buffer.from(`${adminPassword}:${Date.now()}`).toString('base64')
    res.json(reply(0, '登录成功', { token }))
  } else {
    res.status(401).json(reply(1, '密码错误', null))
  }
})

// 管理密码验证中间件
function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '')
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  if (!token) {
    return res.status(401).json(reply(1, '未登录', null))
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    if (decoded.startsWith(adminPassword + ':')) {
      next()
    } else {
      res.status(401).json(reply(1, '登录已过期', null))
    }
  } catch {
    res.status(401).json(reply(1, '无效的登录凭证', null))
  }
}

// 获取图片列表
app.get('/admin/images', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const baseUrl = process.env.BASE_IMG_URL || ''

    const result = await listCnbFiles('imgs')

    // 解析文件列表
    let files = []
    if (result && result.entries) {
      files = result.entries
        .filter((entry) => entry.type === 'file')
        .map((entry) => ({
          name: entry.name,
          path: entry.path || `imgs/${entry.name}`,
          size: entry.size || 0,
          lastModified: entry.lastModified || entry.last_commit_time || '',
          url: baseUrl + 'api/img/' + entry.name,
          originalUrl: 'https://cnb.cool/' + process.env.SLUG_IMG + '/-/imgs/' + entry.name,
        }))
    }

    // 按时间倒序
    files.sort((a, b) => {
      const ta = new Date(a.lastModified).getTime() || 0
      const tb = new Date(b.lastModified).getTime() || 0
      return tb - ta
    })

    // 分页
    const total = files.length
    const start = (page - 1) * pageSize
    const list = files.slice(start, start + pageSize)

    res.json(reply(0, '获取成功', { list, total, page, pageSize }))
  } catch (err) {
    console.error('获取图片列表失败:', err.message)
    res.status(500).json(reply(1, '获取图片列表失败', err.message))
  }
})

// 删除图片
app.post('/admin/delete', adminAuth, async (req, res) => {
  try {
    const { fileName } = req.body
    if (!fileName) {
      return res.status(400).json(reply(1, '缺少文件名', null))
    }

    const filePath = `imgs/${fileName}`
    await deleteCnbFile(filePath)

    res.json(reply(0, '删除成功', null))
  } catch (err) {
    console.error('删除图片失败:', err.message)
    res.status(500).json(reply(1, '删除失败', err.message))
  }
})

export default app
