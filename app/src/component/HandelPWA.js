import { useEffect, useState } from "react";
import { useAddToHomescreenPrompt } from "./useAddToHomescreenPrompt.js";
import '../Styles/HandelPWA.css'
export default function HandelPWA() {

    const [prompt, promptToInstall] = useAddToHomescreenPrompt();
    const [isVisible, setVisibleState] = useState(false);

    const hide = () => setVisibleState(false);

    useEffect(
        () => {
            if (prompt) {
                setVisibleState(true);
            }
        },
        [prompt]
    );

    if (!isVisible) {
        return <div />;
    }

    return (
        <div className="PWACountiner">
            <div className="pwa">
                <button onClick={()=>{promptToInstall();hide()}} className="btn border-0 p-0">Add to Home Screen</button>
                <span onClick={() => hide()} className="icon">close</span>
            </div>
        </div>
    );
}