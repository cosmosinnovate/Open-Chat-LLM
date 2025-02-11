import { Edit2Icon, Ellipsis, Trash2Icon } from "lucide-react";
import { MessageResponse, removeChatHistory } from "../features/chat/chatSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { useAppDispatch } from "../store";
import { ClickAwayListener, Popper } from "@material-ui/core";

export function ChatMessage({
  messageResponse,
  isEditing,
  showModel,
  onEditTitle,
  onRenameTitle,
  onShowModel} : {
  messageResponse: MessageResponse;
  isEditing: boolean;
  showModel: string | null;
  onEditTitle: (id: string) => void;
  onRenameTitle: (value: string) => void;
  onShowModel: (id: string) => void;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { chatId } = useParams();
  const [hover, setHover] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [titleValue, setTitleValue] = useState(messageResponse.title || "");

  const handleDeleteChatHistory = async (id: string) => {
    localStorage.removeItem("chatId");
    dispatch(removeChatHistory(id));
    navigate("/new");
  };

  const handleOnChange = (value: string) => {
    setTitleValue(value);
  };

  const displayChatTitle = () => {
    return (
      <div className={`flex w-full p-2 mb-2 items-center hover:bg-gray-100 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${messageResponse?.id === chatId ? "bg-gray-100 h-12" : "h-12"}`}>
        <p
          className="truncate text-[14px] w-full"
          onClick={() => navigate(`/o/chat/${messageResponse?.id}`)}
        >
          {messageResponse?.title || "Untitled Chat"}
        </p>

        <div ref={anchorRef}>
          {hover && messageResponse?.id !== chatId && (
            <Ellipsis onClick={() => {
              console.log("Ellipsis clicked"); // Debugging log
              onShowModel(messageResponse?.id as string); // This should trigger the model toggle
            }} className="cursor-pointer h-12" />
          )}

          {messageResponse?.id === chatId && (
            <Ellipsis onClick={() => {
              console.log("Ellipsis clicked"); // Debugging log
              onShowModel(messageResponse?.id as string); // This should trigger the model toggle
            }} className="cursor-pointer h-12" />
          )}
        </div>
      </div>
    );
  };

  const renameChatTitle = () => {
    return (
      <div className="text-[14px] w-full mb-2" onMouseLeave={() => renameChatTitle()}>

        <ClickAwayListener onClickAway={() => onRenameTitle(titleValue)}>
          <input
            className="flex p-2 w-full rounded-xl border border-blue-100"
            onChange={(e) => handleOnChange(e.target.value)}
            value={titleValue}
            autoFocus
          />
        </ClickAwayListener>
      </div>
    );
  };

  return (
    <div key={messageResponse?.id}
      className={`flex`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {isEditing ? renameChatTitle() : displayChatTitle()}

      <Popper
        id={chatId}
        open={showModel === messageResponse.id}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        onClick={(e) => {
          e.stopPropagation();
          onShowModel("");
        }}
        className="flex flex-col gap-4 w-[100px] absolute bg-white rounded-md shadow-md  mt-2 z-50"
      >
        <ClickAwayListener onClickAway={() => onShowModel("")}>
          <button
            type="button"
            className="flex text-[12px] flex-row gap-2  text-blue-600 cursor-pointer pl-4 pt-4"
            onClick={() => onEditTitle(messageResponse?.id as string)}
          >
            <Edit2Icon size={16}/>
            <p>Edit</p>
          </button>
        </ClickAwayListener>

        <ClickAwayListener onClickAway={() => onShowModel("")}>
          <button
            type="button"
            className="flex text-[12px]  pl-4 flex-row gap-2 text-red-600 cursor-pointer hover:bg-gray-50  pb-4"
            onClick={() =>
              handleDeleteChatHistory(messageResponse?.id as string)
            }
          >
            <Trash2Icon size={16} />
            <p>Delete</p>
          </button>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
