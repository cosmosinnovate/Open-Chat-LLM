import { Edit2Icon, Ellipsis, Trash2Icon } from "lucide-react";
import { MessageResponse, removeChatHistory } from "../features/chat/chatSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { useAppDispatch } from "../store";
import { ClickAwayListener, Popper } from "@material-ui/core";

export function ChatMessage({ messageResponse }: { messageResponse: MessageResponse; }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { chatId } = useParams();
  const [hover, setHover] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [renameTitle, setRenameTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(messageResponse.title || "");

  const handleClick = () => {
    setShowModel((show) => !show);
  };

  const handleRenameTitle = () => {
    setRenameTitle(false);
  }

  const handleDeleteChatHistory = async (id: string) => {
    localStorage.removeItem("chatId");
    dispatch(removeChatHistory(id));
    navigate("/new");
  };

  const handleOnChange = (value: string) => {
    setTitleValue(value);
  }

  const displayChatTitle = () => {
    return (
      <div className={`flex w-full p-2 mb-2 items-center h-10 hover:bg-gray-100 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${messageResponse?.id === chatId ? "bg-gray-200" : ""}`}>

        <p className="truncate text-[12px] w-full"
          onClick={() => navigate(`/o/chat/${messageResponse?.id}`)}>
          {messageResponse?.title || "Untitled Chat"}
        </p>

          <div ref={anchorRef}>
            {hover && messageResponse?.id !== chatId && (
              <Ellipsis onClick={handleClick} className="cursor-pointer" />
            )}
            {messageResponse?.id === chatId && (
              <Ellipsis onClick={handleClick} className="cursor-pointer" />
            )}
          </div>
      </div>
    );
  };

  const renameChatTitle = () => {
    return (
        <div className="text-[12px] w-full" onMouseLeave={() => setShowModel(false)}>
        <ClickAwayListener onClickAway={handleRenameTitle}>
          <input className="flex p-2 w-full rounded-xl border border-blue-100"
            onChange={(e) => handleOnChange(e.target.value)}
            value={titleValue}
            autoFocus />
            </ClickAwayListener>
        </div>

    );
  };

  return (
    <div
      key={messageResponse?.id}
      className={`flex`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      { !renameTitle && messageResponse?.id === chatId ? displayChatTitle() : renameChatTitle()}


      <Popper
        id={chatId}
        open={showModel}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        onClick={handleClick}
        className="flex flex-col gap-4 w-40 absolute bg-white rounded-md shadow-md  mt-2 z-50"
      >
        <ClickAwayListener onClickAway={handleClick}>
          <button
            type="button"
            className="flex flex-row gap-2  text-gray-600 cursor-pointer px-4 pt-4"
            onClick={() => setRenameTitle(true)}
          >
            <Edit2Icon />
            <p>Edit</p>
          </button>
        </ClickAwayListener>

        <ClickAwayListener onClickAway={handleClick}>
          <button
            type="button"
            className="flex flex-row gap-2 text-red-600 cursor-pointer hover:bg-gray-50 px-4 pb-4"
            onClick={() =>
              handleDeleteChatHistory(messageResponse?.id as string)
            }
          >
            <Trash2Icon />
            <p>Delete</p>
          </button>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}
