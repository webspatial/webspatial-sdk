export const MOCHA_RESULT_API = '/api/mockresult'
const config = {
  appID: 'cli_a6e3e4809ebd500c',
  appSecret: 'Xmb3brTadDGwQzEQszOjtfIgyZqr040n',
  myReceiveID: 'ou_f4d2db0b1d9f396936dc450a83ec40d2',
  groupReceiveID: 'oc_ff1c2256d7e8b6e80905adac71cd45d8',
}

export function postMochaResult(data: TestResults) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }
  return fetch(MOCHA_RESULT_API, requestOptions).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
}

export async function bot_card_msg_send_to_me(msg: string) {
  const url =
    'https://fsopen.bytedance.net/open-apis/im/v1/messages?receive_id_type=open_id'
  const payload1 = JSON.stringify({
    content: msg,
    msg_type: 'interactive',
    receive_id: config.myReceiveID,
    uuid: '',
  })
  const token = await get_tenant_access_token()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  }

  try {
    // send msg to me
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload1,
    })
    const responseText1 = await response.text()
    console.log('response when sending msg to me: ' + responseText1)
    return responseText1
  } catch (error) {
    console.error('发送消息时出错:', error)
    throw error
  }
}

export async function bot_card_msg_send_to_group(msg: string) {
  const url =
    'https://fsopen.bytedance.net/open-apis/im/v1/messages?receive_id_type=chat_id'
  const payload1 = JSON.stringify({
    content: msg,
    msg_type: 'interactive',
    receive_id: config.groupReceiveID,
    uuid: '',
  })
  const token = await get_tenant_access_token()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  }

  try {
    // send msg to group
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload1,
    })
    const responseText1 = await response.text()
    console.log('response when sending msg to group: ' + responseText1)
    return responseText1
  } catch (error) {
    console.error('发送消息时出错:', error)
    throw error
  }
}

async function get_tenant_access_token() {
  const url =
    'https://fsopen.bytedance.net/open-apis/auth/v3/tenant_access_token/internal'
  const payload = JSON.stringify({
    app_id: config.appID,
    app_secret: config.appSecret,
  })

  const headers = {
    'Content-Type': 'application/json',
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
    })

    const responseText = await response.text()
    // 解析响应文本获取token
    const token = responseText.split(':')[4].split('"')[1]
    console.log('Token: ' + token)
    return token
  } catch (error) {
    console.error('error getting tenant access token:', error)
    throw error
  }
}

export async function postResultToLark(results: TestResults) {
  const passedTests = results.passes.map(item => item.title).join(', ')
  const failedTests = results.failures.map(item => item.title).join(', ')
  const messageContent = {
    schema: '2.0',
    config: {
      update_multi: true,
      style: {
        text_size: {
          normal_v2: {
            default: 'normal',
            pc: 'normal',
            mobile: 'heading',
          },
        },
      },
    },
    body: {
      direction: 'vertical',
      padding: '12px 12px 12px 12px',
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: '',
            text_size: 'normal_v2',
            text_align: 'left',
            text_color: 'default',
          },
          margin: '0px 0px 0px 0px',
        },
        {
          tag: 'markdown',
          // "content": "coreSDK version: "  + getPackageVersion("@webspatial/core-sdk") + "  \nreactSDK version: "  + getPackageVersion("@webspatial/react-sdk") + "\nbuilderVersion version: "  + getPackageVersion("@webspatial/builder") + " \n",
          text_align: 'left',
          text_size: 'normal_v2',
          margin: '0px 0px 0px 0px',
        },
        {
          tag: 'hr',
          margin: '0px 0px 0px 0px',
        },
        {
          tag: 'markdown',
          content:
            '<number_tag>1</number_tag>Passed Tests: ' +
            passedTests +
            ' \n<number_tag>2</number_tag>Failed Tests: ' +
            failedTests +
            ' \n',
          text_align: 'left',
          text_size: 'normal_v2',
          margin: '0px 0px 0px 0px',
        },
        {
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: '',
            text_size: 'normal_v2',
            text_align: 'left',
            text_color: 'default',
          },
          margin: '0px 0px 0px 0px',
        },
      ],
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '[XR-Foundation]CI Test Complete',
      },
      subtitle: {
        tag: 'plain_text',
        content: 'Web Spatial Local AVP API Test',
      },
      text_tag_list: [
        {
          tag: 'text_tag',
          text: {
            tag: 'plain_text',
            content: 'WebSpatial',
          },
          color: 'neutral',
        },
      ],
      template: 'green',
      padding: '12px 12px 12px 12px',
    },
  }
  await bot_card_msg_send_to_me(JSON.stringify(messageContent))
  // await bot_card_msg_send_to_group(JSON.stringify(messageContent))
}
