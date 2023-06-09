import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";

export function useAddToHomescreenPrompt(){
  const [prompt, setState] = useState(null);
  const promptToInstall = () => {
    if (prompt) {
      return prompt.prompt();
    }
    return (
      console.log('Tried installing before browser sent "beforeinstallprompt" event')
    );
  };

  useEffect(() => {
    const ready = (e) => {
      e.preventDefault();
      setState(e);
    };

    window.addEventListener("beforeinstallprompt", ready );

    return () => {
      window.removeEventListener("beforeinstallprompt", ready );
    };
  }, []);

  return [prompt, promptToInstall];
}