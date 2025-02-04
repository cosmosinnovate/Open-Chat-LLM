
import { MenuIcon } from 'lucide-react'
import { FC } from 'react';

interface TopMenuProps {
    toggleMenu: () => void;
    className?: string; // Add className prop
}

const TopMenu: FC<TopMenuProps> = ({ toggleMenu }) => {

    return (
        <div className="topbar fixed top-0 left-[250px] right-0 h-[60px] bg-[#ffff] text-white p-[15px] px-[20px] z-[4] transition-all duration-300 ease-in-out flex items-center gap-[15px]">
            <MenuIcon onClick={toggleMenu} color='black' cursor={""}/>
            <div className="flex flex-row">
                <span className="text-[#fa6f73] font-['poppins'] font-bold">Org</span>
                <span className="text-[#a1b3ff] font-extrabold font-['poppins']">//</span>
                <span className="text-[#a1b3ff] font-bold">Pedia</span>
            </div>
        </div>
    );
}

export default TopMenu;