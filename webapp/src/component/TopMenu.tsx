
import { MenuIcon} from 'lucide-react'
import { FC } from 'react';

interface TopMenuProps {
  toggleMenu: () => void;
  className?: string; // Add className prop
}

const TopMenu: FC<TopMenuProps> = ({toggleMenu}) => {

    return (
        <div className="topbar fixed top-0 left-[250px] right-0 h-[60px] bg-[#3498db] text-white p-[15px] px-[20px] z-[4] transition-all duration-300 ease-in-out flex items-center gap-[15px]">
            <MenuIcon onClick={toggleMenu}/>
            <h1>Top Menu</h1>
        </div>
    );
}

export default TopMenu;