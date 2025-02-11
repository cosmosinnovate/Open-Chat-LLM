import { FC } from "react";
import { Message } from "../features/chat/chatSlice";
import { User } from "../features/auth/authSlice";

interface CallToActionItemsProps {
    messages: Message[];
    handleSubmitCustom: (messageContent: string) => void;
    user: User | null;
}


const CallToActionItems: FC<CallToActionItemsProps> = ({ messages, handleSubmitCustom, user }) => {
    return <div className={`text-black md:w-[800px] p-4  ${messages.length > 0 ? 'hidden' : 'block'} flex flex-col justify-center my-auto mx-auto w-full font-semibold text-2xl mt-10`}>
        <div className="text-black font-medium text-2xl mb-4">Welcome back {user?.display_name.split(" ")[0]}</div>
        <div className="text-black font-medium text-xl mb-4">Time to do executive catch up</div>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-around font-bold ">
            <div className="w-full p-4 text-2xl shadow flex flex-col justify-around items-center rounded-[10px] border"
                onClick={() => handleSubmitCustom('Market Trends and Competitive Analysis: AI use case in organization lost knowledge due to employee getting fired or quitting and its impact on long growth to the organization')}>
                <div className="text-black text-sm text-center">Market Trends and Competitive Analysis</div>
            </div>

            <div  className="w-full p-4 shadow flex flex-col justify-around items-center rounded-[10px] border"
                onClick={() => handleSubmitCustom('Strategic Goals and Business Objectives')}
            >
                <div className="text-black text-sm text-center">Strategic Goals and Business Objectives</div>
            </div>
            <div className="w-full p-4 shadow flex flex-col justify-around items-center rounded-[10px] border"
                onClick={() => handleSubmitCustom('Organizational Structure and Key Team Profiles')}>
                <div className="text-black text-sm text-center">Organizational Structure and Key Team Profiles</div>
            </div>
        </div>
    </div>;
}


export default CallToActionItems