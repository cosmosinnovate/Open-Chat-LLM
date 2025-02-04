import React from 'react';
import { logoutUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { AppDispatch, RootState } from '../store';
import { MessageResponse } from '../features/chat/chatSlice';
import { ChatMessage, useFetchHook } from '../hooks/sideMenuHooks';

interface SideMenuProps {
  selectedChatService: 'llama3.2' | 'deepseek-r1';
  handleSelectedChatService: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isOpen: boolean;
  toggleMenu: () => void;
  className?: string; // Add className prop
}

const SideMenu: React.FC<SideMenuProps> = ({ selectedChatService, handleSelectedChatService }) => {
  const navigate = useNavigate()
  const dispatch: AppDispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  useFetchHook(dispatch, user);
  const { chat } = useAppSelector((select: RootState) => select)

  console.log(user?.photo_url)

  const logUserOut = () => {
    dispatch(logoutUser())
    navigate('/')
  }

  return (
    <div className={`sidebar fixed left-0 top-0 w-[250px] h-[100vh] bg-[#fafafa] text-[#242d48] p-6 z-3 transition-all duration-300 ease-in-out`}>
      <nav className="flex flex-col h-full justify-between">
        <div className="block">
          <div>
            {/* <img src={user?.photo_url}/> */}
            <label>{user?.display_name}</label>
          </div>

          {/* LLM Selection */}
          <div>
            <label>Select LLM Service</label>
            <select
              value={selectedChatService}
              onChange={handleSelectedChatService}
              className="bg-white border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 my-2 rounded-md w-full"
            >
              <option value={"llama3.2"}>LLama3.2</option>
              <option value={"deepseek-r1"}>DeepSeek-r1</option>
            </select>
          </div>

          {/* Scrollable Chat History */}
          <div className="mt-4 h-flex flex-col">
            <div className='mb-4'>Today</div>
            <div className="flex flex-col overflow">
              {chat.chat ? chat.chat.map((m: MessageResponse) => (
                <ChatMessage key={m.id} m={m} />
              )) : (
                <div className="text-gray-500">No chat history</div>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="text-sm font-bold mb-10 cursor-pointer hover:text-blue-600 mt-10" onClick={logUserOut}>
          Log out
        </div>
      </nav>

    </div>
  );
};


export default SideMenu;