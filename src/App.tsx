import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Convert } from "easy-currencies";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import MarkdownRenderer from './CodeBlock.tsx';
import GptModels from "./GptModels.ts";


const localStorageKey = "chat-history";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // This is the default and can be omitted
  dangerouslyAllowBrowser: true,
});

function App() {
  const inputFormRef = useRef<HTMLTextAreaElement>(null);
  const [streamAnswer, setStreamAnswer] = useState<string>("");
  const [modelName, setGptModel] = useState<string>("gpt-5");
  const [chats, setChats] = useState({
    list: [{ title: "New Chat", chat: [] }],
  });
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // chat履歴の読み込み
  useEffect(() => {
    const chatHistory = JSON.parse(
      localStorage.getItem(localStorageKey) || `{"list":[]}`
    );
    if (chatHistory.list.length){
      setChats(chatHistory);
    }
    // fetch("./chat-history.json")
    //   .then((res) => res.json())
    //   .then((data) => setChats(data));
  }, []);

  // 最下部までスクロール
  useEffect(() => {
    scrollToLatest();
  }, [activeIdx, streamAnswer, chats]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const model = event.target.value;
    setGptModel(model);
  }

  // チャット履歴をローカルストレージに保存
  const saveChat = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(chats));
  };

  // サイドバーにチャット追加
  const addNewChat = () => {
    setChats({
      list: [{ title: "New Chat", chat: [] }, ...chats["list"]],
    });
    setActiveIdx(0);
  };

  // サイドバーのチャット削除
  const delWholeChat = (idx: number) => {
    if (chats.list[idx].chat.length && !window.confirm("Delete this chat history?")) return;

    const curchat = { ...chats };
    curchat.list.splice(idx, 1);
    setChats(curchat);

    // インデックス再選択
    const newidx = curchat.list.length > idx ? idx : curchat.list.length - 1;
    setActiveIdx(newidx);

    // チャット履歴保存
    saveChat();
  };

  // チャットの個別会話削除
  const delChat = (idx: number) => {
    if (!window.confirm("Delete this chat?")) return;

    const curchat = { ...chats };
    curchat.list[activeIdx].chat.splice(idx, 1);
    setChats(curchat);

    // チャット履歴保存
    saveChat();
  };

  // 最下要素への自動スクロール
  const scrollToLatest = () => {
    messageEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const postQuery = async (query: string) => {
    // 質問文の表示
    const curchat = { ...chats };
    curchat.list[activeIdx].chat.push({ role: "user", content: query, model: "", cost: 0});
    setChats(curchat);

    // token量を考慮し会話履歴を過去9件に絞ってリクエスト
    const last9chats = chats.list[activeIdx].chat.slice(-9);
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: last9chats as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      stream: true,
      stream_options: {
        include_usage: true
      }
    })
    .catch(e => {
      alert(e);  // o1モデルはtier3以降のユーザーが対象でエラーになる場合がある
      return;
    });

    // レスポンス
    let cost = 0
    let answer = "";
    for await (const chunk of stream) {
      answer += chunk.choices[0]?.delta?.content || "";
      setStreamAnswer(answer);

      if(chunk.usage !== null){
        // 現在の為替レートでAPIコストを算出
        const input_tokens = (chunk.usage?.prompt_tokens ?? 0)
        const cached_input_tokens = (chunk.usage?.prompt_tokens_details?.cached_tokens ?? 0)
        const output_tokens = (chunk.usage?.completion_tokens ?? 0)
        cost = GptModels[modelName].input_doller * (input_tokens - cached_input_tokens) + 
               GptModels[modelName].cached_input_doller * cached_input_tokens + 
               GptModels[modelName].output_doller * output_tokens;
        cost = await Convert(cost).from("USD").to("JPY");
      }
    }
    curchat.list[activeIdx].chat.push({role: "assistant", content: answer, model: modelName, cost: cost });

    setStreamAnswer("");
    setChats(curchat);

    // チャット名がNew Chatの場合はタイトルを付ける
    if (curchat.list[activeIdx].title === "New Chat") {
      await setChatTitle(query);
    }
    saveChat();
  };

  // サイドバーのチャットタイトルの自動設定
  const setChatTitle = async (query: string) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            "以下の文章のタイトルを日本語で最大10文字で簡潔に付けてください。括弧は不要です。\n" +
            query,
        },
      ],
    });

    const title = completion.choices[0].message.content;
    if (title) {
      const curchat = { ...chats };
      curchat.list[activeIdx].title = title;
      setChats(curchat);
    }
  };

  // 入力フォームでの確定押下
  const enterSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter" && !e.shiftKey && inputFormRef.current !== null) {
      const query = inputFormRef.current.value;
      inputFormRef.current.value = "";
      postQuery(query);
      e.preventDefault();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-white">
      {/* sidebar */}
      <div className="bg-slate-800 overflow-auto w-52">
        <div className="italic text-center m-3 text-xl">Private ChatGPT</div>      
        {/* gpt-model select */}
        <select value={modelName} onChange={handleModelChange} className="flex mx-auto bg-slate-800 text-center mb-5">
          {Object.keys(GptModels).map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <ul>
          {/* newchat */}
          <li
            className="flex p-3 text-green-500 hover:bg-slate-600 hover:cursor-pointer"
            onClick={() => addNewChat()}
          >
            <AddIcon /> 新しいチャット
          </li>

          {/* chat histories */}
          {chats.list.map((value, key) => {
            return (
              <li
                key={key}
                className={`flex p-3 ${
                  key === activeIdx
                    ? "bg-slate-600"
                    : "hover:cursor-pointer hover:bg-slate-600"
                }`}
                onClick={() => setActiveIdx(key)}
              >
                {value.title}
                <DeleteOutlineIcon
                  titleAccess="削除"
                  className="p-1 ml-auto hover:text-red-500 hover:cursor-pointer hover:p-0"
                  onClick={() => delWholeChat(key)}
                />
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* chat UI */}
      <div className="flex-1 flex flex-col bg-slate-600">
        <div className="flex-1 overflow-auto">
          {chats.list[activeIdx]?.chat.map((value, key) => {
            return (
              <div key={key} className="m-2 rounded-xl bg-slate-700">
                <div className="text-sm p-2 flex justify-between">
                  {value.role === "assistant" ? `🧠 ${value.model}` : "💁 You"}
                  <DeleteOutlineIcon
                    titleAccess="削除"
                    className="p-1 ml-auto hover:text-red-500 hover:cursor-pointer hover:p-0"
                    onClick={() => delChat(key)}
                  />
                </div>
                {/* <ReactMarkdown className="p-2">{value.content}</ReactMarkdown> */}
                <div className="p-2">
                  <MarkdownRenderer markdown={value.content}/>
                  <div className="p-2 text-red-400">{value.cost > 0 ? `[API料金: ${(value.cost).toFixed(2)}円]` : ""}</div>            
                </div>
              </div>
            );
          })}
          {/* チャット履歴が長くなるとstream出力の更新が重いので回答用の専用divを設けます。
          streamが終われば回答をチャット履歴に追加して、こちらはinvisibleにする */}
          <div
            className={`rounded-xl m-2 bg-slate-700 ${
              streamAnswer.length === 0 ? "hidden" : ""
            }`}
          >
            <div className="text-sm p-2">{"🧠 " + modelName}</div>
            <div className="p-2"><MarkdownRenderer markdown={streamAnswer}/></div>
          </div>
          {/* 自動スクロール用のダミー要素 */}
          <div id="lastelment" ref={messageEndRef} />
        </div>
        <textarea
          className="bg-slate-200 rounded-lg p-1 m-2 text-black resize-none"
          rows={3}
          ref={inputFormRef}
          onKeyDown={enterSubmit}
          placeholder="ここに入力... Enterで送信"
        />
      </div>
    </div>
  );
}

export default App;
