import { SendIcon, UploadIcon } from "lucide-react";
import { FC } from "react";

interface ChatBoxProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement | KeyboardEvent | HTMLTextAreaElement>) => void;
  handleAbort: (event: React.MouseEvent<HTMLButtonElement>) => void;
  abortControllerRef: React.RefObject<AbortController | null>;
}

const ChatBox: FC<ChatBoxProps> = ({ inputValue, setInputValue, isLoading, handleAbort, handleSubmit, abortControllerRef }) => {
  return <div className={`chat-box fixed left-[250px] right-0 bottom-0 bg-white px-[20px] flex gap-[10px] z-[4] transition-all duration-300 ease-in-out  pb-10`}>
    <form onSubmit={handleSubmit} className={`flex flex-col items-center shadow-sm bg-[#F5F5F5] rounded-xl w-full md:w-[900px] mx-auto p-[15px]`}>
      <textarea
        value={inputValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);
          e.target.style.height = 'auto'; // Reset height to shrink if needed
          const currentScrollHeight = e.target.scrollHeight;
          const newHeight = Math.min(Math.max(currentScrollHeight, 100), 200);
          e.target.style.height = `${newHeight}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
        className="flex-1 bg-[#F5F5F5] text-gray-700 focus:outline-none p-2 text-xl w-full"
        placeholder="Type your message..."
        rows={1}
        style={{
          resize: 'none',
          lineHeight: '24px',
          minHeight: '100px',
          maxHeight: '400px'
        }}
        disabled={isLoading}
      />

      {/* Chat box buttons */}
      <div className="flex w-full flex-row justify-between">
        <button
          type="submit"
          className="text-white rounded-full h-10 w-10 justify-center flex items-center focus:outline-none"
          disabled={isLoading}
        >
          <UploadIcon color='black' />
        </button>
        {(abortControllerRef.current && isLoading) && (
          <button
            type="submit"
            onClick={(e) => handleAbort(e)}
            className="text-white rounded-full h-10 w-10 justify-center flex items-center focus:outline-none"
          >
            <div className="w-4 h-4 bg-black" />
          </button>
        )}

        {!abortControllerRef.current && (
          <button
            type="submit"
            className={`text-white rounded-full h-10 w-10 justify-center flex items-center focus:outline-none ${isLoading && 'cursor-not-allowed'}`}
          >
            {inputValue && !isLoading && <SendIcon color='black' />}
          </button>
        )}
      </div>

    </form>
  </div>
}

export default ChatBox;