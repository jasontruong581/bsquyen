import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import '@fontsource/be-vietnam-pro/vietnamese-900.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import '@fontsource/be-vietnam-pro/latin-900.css';
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/** Giữ khung hình lại cho tới khi font Be Vietnam Pro tải xong. */
export const useFonts = () => {
  const [handle] = useState(() => delayRender('tải font'));
  useEffect(() => {
    Promise.all(['500', '700', '800', '900'].map((w) => document.fonts.load(`${w} 40px "Be Vietnam Pro"`, 'Dạ dày ạ ữ'))).then(() => continueRender(handle));
  }, [handle]);
};
