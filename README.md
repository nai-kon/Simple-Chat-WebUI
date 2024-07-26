# Private ChatGPT

OpenAIのGPT-4oのAPIを叩くChatGPT風アプリ。月額3000円でChatGPT Plusを利用していましたが、利用頻度的にAPIを直接叩いた方が安かったので、Vite+React+tailwindcssで自作しました。
なるべく本家ChatGPTに近い動作にしています。

![demo.gif](demo.gif)

## 主な機能

* チャットの作成/削除
 * 個別の会話も削除できるため、会話の流れがおかしくなった時に途中からやり直せます
* 応答のストリーミング出力
* チャットのタイトルを自動生成
* シンタックスハイライト対応
* モデルの切り替え (GPT-4o, GPT-4o-mini)
* API利用料の表示
* チャット履歴はブラウザのローカルストレージに保存

## 未対応機能
* 画像の入出力


## Project setup

```bash
npm install
echo 'export const apikey = "XXXXXX";' > src/openai-key.ts
```
put openai api key to `XXXXXX`

### Compiles and hot-reloads for development
```
npm run dev
```