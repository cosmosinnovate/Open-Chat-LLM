import React from 'react';
import { logoutUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { AppDispatch, RootState } from '../store';
import { MessageResponse } from '../features/chat/chatSlice';
import { useFetchHook } from '../hooks/sideMenuHooks';
import { ChatMessage } from './ChatMessage';

interface SideMenuProps {
  selectedChatService: 'llama3.2' | 'deepseek-r1';
  handleSelectedChatService: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isOpen: boolean;
  toggleMenu: () => void;
  className?: string;
}

const SideMenu: React.FC<SideMenuProps> = () => {
  const navigate = useNavigate()
  const dispatch: AppDispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  useFetchHook(dispatch, user);
  const { chat } = useAppSelector((select: RootState) => select)

  const logUserOut = () => {
    dispatch(logoutUser())
    navigate('/')
  }

  return (
    <div className={`sidebar fixed left-0 top-0 w-[250px] h-[100vh] bg-[#fafafa] text-[#242d48] z-3 transition-all duration-300 ease-in-out overflow-hidden `}>
      <nav className="flex flex-col h-full justify-between">
        <div className="block">

          <div className='p-4'>
            {/* <img src={user?.photo_url}/> */}
            <div className="flex flex-row">
                <span className="text-[#fa6f73] font-['poppins'] font-bold">Insight</span>
                {/* <span className="text-[#a1b3ff] font-extrabold font-['poppins']">//</span> */}
                <span className="text-[#a1b3ff] font-bold">Core</span>
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
        
          <div className="mt-4 flex flex-col h-[calc(100vh-180px)]">

            <div className='mb-4 px-4'>Today</div>

            <div className="flex-1 overflow-y-auto px-4"> 
              {chat.chat ? chat.chat.map((messageResponse: MessageResponse) => (
                <ChatMessage key={messageResponse.id} messageResponse={messageResponse} />
              )) : (
                <div className="text-gray-500">No chat history</div>
              )}
            </div>
            
          </div>
        </div>

        {/* Make this open a  */}
        <div className="border-t flex flex-row align-center items-center gap-2 text-sm font-bold mb-10 cursor-pointer hover:text-blue-600 mt-10 p-4" onClick={logUserOut}>
          <img 
              src={user?.photo_url} 
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
