import { useEffect, useState, useRef } from "react";
import OpenAI from "openai";
import { apikey } from "./openai-key.ts";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// import ReactMarkdown from 'react-markdown';

const gptmodel = "gpt-4-0125-preview";
const localStrageKey = "chat-history";

const openai = new OpenAI({
  apiKey: apikey, // This is the default and can be omitted
  dangerouslyAllowBrowser: true,
});

function App() {
  const [query, setQuery] = useState<string>("");
  const [streamAnswer, setStreamAnswer] = useState<string>("");
  const [chats, setChats] = useState({
    list: [{ title: "", chat: [{ role: "", content: "" }] }],
  });
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // chat履歴の読み込み
  useEffect(() => {
    const chatHistory = JSON.parse(
      localStorage.getItem(localStrageKey) || `{"list":[]}`
    );
    setChats(chatHistory);
    // fetch("./chat-history.json")
    //   .then((res) => res.json())
    //   .then((data) => setChats(data));
  }, []);

  // 最下部までスクロール
  useEffect(() => {
    scrollToLatest();
  }, [streamAnswer, activeIdx, query]);

  const addNewChat = () => {
    setChats({
      list: [{ title: "New Chat", chat: [] }, ...chats["list"]],
    });
    setActiveIdx(0);
  };

  const saveChat = () => {
    // ローカルストレージに保存
    localStorage.setItem(localStrageKey, JSON.stringify(chats));
  };

  // サイドバーの項目削除
  const delIndex = (idx: number) => {
    if (!window.confirm("Delete Chat?")) return;

    const curchat = { ...chats };
    curchat.list.splice(idx, 1);
    setChats(curchat);

    // インデックス再選択
    const newidx = curchat.list.length > idx ? idx : curchat.list.length - 1;
    console.log(curchat.list.length, idx, newidx);
    setActiveIdx(newidx);

    // 保存
    saveChat();
  };

  const scrollToLatest = () => {
    messageEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const postQuery = async () => {
    const curchat = { ...chats };
    curchat.list[activeIdx].chat.push({ role: "user", content: query });
    setChats(curchat);
    setQuery("");

    const stream = await openai.chat.completions.create({
      model: gptmodel,
      messages: chats.list[activeIdx]
        .chat as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      stream: true,
    });

    let answer = "";
    // stream=trueだとprompt_tokens, completion_tokensを取得できない
    for await (const chunk of stream) {
      answer += chunk.choices[0]?.delta?.content || "";
      setStreamAnswer(answer);
    }

    curchat.list[activeIdx].chat.push({ role: "assistant", content: answer });

    setStreamAnswer("");
    setChats(curchat);

    // チャット名がNew Chatの場合はタイトルを付ける
    if (curchat.list[activeIdx].title === "New Chat") {
      await setChatTitle();
    }
    saveChat();
  };

  const setChatTitle = async () => {
    const completion = await openai.chat.completions.create({
      model: gptmodel,
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

  const enterSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter" && !e.shiftKey) {
      postQuery();
      e.preventDefault();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-white whitespace-pre-wrap whitespace-break-spaces">
      {/* sidebar */}
      <div className="bg-slate-800 overflow-auto w-52">
        <div className="italic text-center m-3 mb-5 text-xl">Private ChatGPT</div>
        <ul>
          <li
            className="flex p-3 text-green-500 hover:bg-slate-600 hover:cursor-pointer"
            onClick={() => addNewChat()}
          >
            <AddIcon /> Add New Chat
          </li>
          {chats.list.reverse().map((value, key) => {
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
                  className="p-1 ml-auto hover:text-red-500 hover:cursor-pointer hover:p-0"
                  onClick={() => delIndex(key)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-1 flex flex-col bg-slate-600">
        <div className="flex-1 overflow-auto">
          {chats.list[activeIdx]?.chat.map((value, key) => {
            return (
              <div key={key} className="m-2 rounded-xl bg-slate-700">
                <div className="text-sm p-2">
                  {value.role === "assistant" ? "🧠 " + gptmodel : "💁 You"}
                </div>
                {/* <ReactMarkdown className="p-2">{value.content}</ReactMarkdown> */}
                <div className="p-2">{value.content}</div>
              </div>
            );
          })}
          {/* streamの回答をsetChatsしても描画されないので(全チャット履歴につき更新差分チェックが大変だから？)、回答用に専用のdivを設けます
          streamが終われば回答をsetchatsして、こちらはinvisibleにする */}
          <div
            className={`rounded-xl m-2 bg-slate-700 ${
              streamAnswer.length === 0 ? "hidden" : ""
            }`}
          >
            <div className="text-sm p-2">{"🧠 " + gptmodel}</div>
            <div className="p-2">{streamAnswer}</div>
          </div>
          {/* 自動スクロール用のダミー要素 */}
          <div id="lastelment" ref={messageEndRef} />
        </div>
        <textarea
          className="bg-slate-200 rounded-lg p-1 m-2 text-black"
          value={query}
          rows={3}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={enterSubmit}
          placeholder="ここに入力... Enterで送信"
        />
      </div>
    </div>
  );
}

export default App;
