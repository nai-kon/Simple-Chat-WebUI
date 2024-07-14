# Private ChatGPT

OpenAIのGPT-4oのAPIを叩くChatGPT風アプリ。月額3000円でChatGPT Plusを利用していましたが、利用頻度的にAPIを直接叩いた方が安かったので、Vite+React+tailwindcssで自作しました。
なるべく本家ChatGPTに近い動作にしています。

![demo.gif](demo.gif)

## 主な機能

* チャットの作成/削除
* 応答のストリーミング出力
* チャットのタイトルを自動生成
* シンタックスハイライトに対応
* API利用料を応答末尾に表示
* チャット履歴はブラウザのローカルストレージに保存

## 未対応機能
* 画像の入出力


## Project setup
```
npm install
echo 'export const apikey = "XXXXXX";' > src/openai-key.ts
```

### Compiles and hot-reloads for development
```
npm run dev
```