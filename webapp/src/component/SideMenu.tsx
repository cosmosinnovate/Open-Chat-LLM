import React, { useCallback, useEffect, useState } from "react";
import { logoutUser } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { AppDispatch, RootState } from "../store";
import { fetchChatHistory, MessageResponse, updateChatTitle } from "../features/chat/chatSlice";
import { ChatMessage } from "./ChatMessage";
import { MessageSquarePlus, SearchIcon } from "lucide-react";

interface SideMenuProps {
  selectedChatService: "llama3.2" | "deepseek-r1";
  handleSelectedChatService: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  isOpen: boolean;
  toggleMenu: () => void;
  clearChatMessageForNew: () => void;
  className?: string;
}

const SideMenu: React.FC<SideMenuProps> = ({ clearChatMessageForNew }) => {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showModel, setShowModel] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchChatHistory());
    };
    loadData();
  }, [dispatch]);

  const handleEditTitle = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  const handleShowModel = (messageId: string) => {
    setShowModel(messageId);
  };

  const handleRenameTitle = (titleValue:string) => {
    handleUpdateChatTitle(titleValue)
    setEditingMessageId(null);
  };

  const logUserOut = () => {
    dispatch(logoutUser());
    navigate("/", { replace: true });
  };

  const handleUpdateChatTitle = useCallback(async (title: string) => {
      dispatch(updateChatTitle({ chatId: editingMessageId as string, title }))
  },[dispatch, editingMessageId])

  const { chat } = useAppSelector((select: RootState) => select);

  return (
    <div className={`sidebar z-50 fixed left-0 top-0 w-[250px] h-[100vh] bg-[#fafafa] text-[#162d48] z-3 transition-all duration-300 ease-in-out overflow-hidden`}>
      <nav className="flex flex-col h-full justify-between">

        <div className="block">
          <div className="p-4">
            <div className="flex flex-row text-[18px]">
              <p className="text-[#130404] font-bold italic">Open</p>
              <p className="text-[#4263f7] font-bold">Chat</p>
            </div>
          </div>

          <div className="flex flex-row gap-2 justify-between items-center rounded-full sticky top-0 p-4">
            <div
              className="flex  items-center justify-center gap-4 p-2 px-4 rounded-full border border-gray-300 shadow-md cursor-pointer"
              onClick={() => {
                navigate("/new");
                localStorage.removeItem("chatId");
              }}
            >
              <SearchIcon color="black" size={16} strokeLinecap={"butt"} />
            </div>

            <div
              className="flex items-center justify-center gap-4 p-2 px-4 rounded-full border border-gray-300 shadow-md cursor-pointer"
              onClick={() => {
                clearChatMessageForNew();
                navigate("/new");
                localStorage.removeItem("chatId");
                // clear redux message list as well.
              }}
            >
              <MessageSquarePlus color="gray" size={16} />
            </div>
          </div>

          {/* LLM Selection */}
          {/* 
              <div>
              <label>Select LLM Service</label>
              <select
                value={selectedChatService}
                onChange={handleSelectedChatService}
                className="bg-white border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 my-2 rounded-md w-full">
                <option value={"llama3.2"}>LLama3.2</option>
                <option value={"deepseek-r1"}>DeepSeek-r1</option>
              </select>
            </div> 
          */}

          {/*           
            <div className="mt-4 flex flex-col h-[calc(100vh-300px)]">
          */}
          <div className="mt-4 flex flex-col h-full">
            <div className="mb-4 px-4 font-medium">Today</div>
            <div className="flex-1 overflow-y-auto px-4">
              {chat ? (
                chat.chat.map((message: MessageResponse) => (
                  <ChatMessage
                    key={message.id}
                    messageResponse={message}
                    isEditing={editingMessageId === message.id}
                    onEditTitle={handleEditTitle}
                    showModel={showModel}
                    onShowModel={handleShowModel}
                    onRenameTitle={handleRenameTitle}
                  />
                ))
              ) : (
                <div className="text-gray-500">No chat history</div>
              )}
              <div className="flex justify-center align-middle h-full">
                {/* {chat.loading && <LucideLoader />} */}
              </div>
            </div>
          </div>
        </div>

        {/* Make this open a  */}
        <div
          className="border-t flex flex-row align-center items-center gap-2 text-sm font-bold mb-10 cursor-pointer hover:text-blue-600 mt-10 p-4"
          onClick={logUserOut}
        >
          <img src={user?.photo_url}
            alt="Google Profile"
            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            referrerPolicy="no-referrer"
          />
          <p>{user?.display_name}</p>
        </div>
      </nav>
    </div>
  );
};

export default SideMenu;
