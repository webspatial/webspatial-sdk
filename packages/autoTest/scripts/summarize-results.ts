import axios from 'axios'
import fs from 'fs'
import path from 'path'

function findReportJson() {
  const reportDir = path.join(__dirname, '..', 'reports')
  const candidates = [
    path.join(reportDir, 'mochawesome.json'),
    path.join(reportDir, 'autotest.json'),
    path.join(__dirname, '..', 'mochawesome-report', 'mochawesome.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

const getTenantAccessToken = async (): Promise<string> => {
  const url =
    'https://open.larkoffice.com/open-apis/auth/v3/tenant_access_token/internal'

  const payload = {
    app_id: process.env.APP_ID,
    app_secret: process.env.APP_SECRET,
  }

  const res = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  return res.data.tenant_access_token
}

const botCardMsgSendToMe = async (msg: string) => {
  const url =
    'https://open.larkoffice.com/open-apis/im/v1/messages?receive_id_type=open_id'

  const token = await getTenantAccessToken()

  const payload = {
    content: msg,
    msg_type: 'interactive',
    receive_id: process.env.MY_RECEIVE_ID,
    uuid: '',
  }

  const res = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  console.log('Send to Me:', res.data)
}

const botCardMsgSendToGroup = async (msg: string) => {
  const url =
    'https://open.larkoffice.com/open-apis/im/v1/messages?receive_id_type=chat_id'

  const token = await getTenantAccessToken()

  const payload = {
    content: msg,
    msg_type: 'interactive',
    receive_id: process.env.GROUP_RECEIVE_ID,
    uuid: '',
  }

  const res = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  console.log('Send to Group:', res.data)
}

async function sendSummaryToLark(
  passed: number,
  failed: number,
  pending: number,
) {
  const websiteUrl = process.env.WEBSITE_URL || 'Default Website URL'
  const githubWorkflowUrl =
    process.env.GITHUB_WORKFLOW_URL || 'Default Github Workflow URL'
  const finishTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const branchName = process.env.BRANCH_NAME || 'Default Branch Name'
  const startTime = process.env.START_TIME || 'Default Start Time'

  const card = JSON.stringify(
    {
      config: { wide_screen_mode: true },
      header: {
        template: 'green',
        title: {
          tag: 'plain_text',
          content: '[XR-Foundation]CI Test Complete',
        },
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '**Test Name：**WebSpatial Auto Test',
          },
        },
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: '**Execute Status：[Success]**',
              },
            },
            { is_short: true, text: { tag: 'lark_md', content: '' } },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Start Time：**${startTime}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**End Time：**${finishTime}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: 'Builder<at email=zhouwenhao.529@bytedance.com />',
              },
            },
          ],
        },
        { tag: 'hr' },
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: '**Build Type：**Puppeteer Mock Platform Auto Test',
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Branch Name：**${branchName}`,
              },
            },
          ],
        },
        { tag: 'hr' },
        {
          tag: 'div',
          text: { tag: 'lark_md', content: '**Test Details**' },
        },
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Passed: **${passed}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Failed: **${failed}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Pending: **${pending}`,
              },
            },
          ],
        },
        { tag: 'hr' },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: 'Github Workflow URL: ' },
              url: githubWorkflowUrl,
              type: 'primary',
            },
            {
              tag: 'button',
              text: { tag: 'plain_text', content: 'Test Result page: ' },
              url: websiteUrl,
              type: 'primary',
            },
          ],
        },
      ],
    },
    null,
    2,
  )
  await botCardMsgSendToMe(card)
  // await botCardMsgSendToGroup(card)
}

function main() {
  const jsonPath = findReportJson()
  if (!jsonPath) {
    console.log('Test summary: no report json found')
    process.exit(0)
  }
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(raw)
  const stats = data && data.stats ? data.stats : data.results?.stats
  if (!stats) {
    console.log('Test summary: report has no stats')
    process.exit(0)
  }
  const passed = Number(stats.passes || 0)
  const failed = Number(stats.failures || 0)
  const pending = Number(stats.pending || 0)
  const summary = `Test summary: ${passed} passed, ${failed} failed, ${pending} pending`
  console.log(summary)
  const outDir = path.dirname(jsonPath)
  fs.writeFileSync(path.join(outDir, 'summary.txt'), summary + '\n', 'utf8')
  sendSummaryToLark(passed, failed, pending)
}

main()
