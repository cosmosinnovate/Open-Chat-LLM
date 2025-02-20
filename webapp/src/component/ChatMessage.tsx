import { Edit2Icon, Ellipsis, Trash2Icon } from "lucide-react";
import { MessageResponse, removeChatHistory } from "../features/chat/chatSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAppDispatch } from "../store";

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
      <div className={`flex w-full p-2 mb-2 items-center hover:bg-gray-100 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${messageResponse?.id === chatId ? "bg-blue-100 h-12" : "h-12"}`}>
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

      <CustomPopper
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
      </CustomPopper>
    </div>
  );
}


interface PopperProps {
  id?: string;
  open: boolean;
  anchorEl: HTMLElement | null;
  placement?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const CustomPopper: React.FC<PopperProps> = ({
  open,
  anchorEl,
  children,
  className,
  onClick
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorEl && open) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 100 // Adjust based on your needs
      });
    }
  }, [anchorEl, open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  );
};


interface ClickAwayListenerProps {
  onClickAway: () => void;
  children: React.ReactNode;
}

export const ClickAwayListener: React.FC<ClickAwayListenerProps> = ({
  onClickAway,
  children
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClickAway();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickAway]);

  return <div ref={wrapperRef}>{children}</div>;
};