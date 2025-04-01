import React, { createContext, useState, useContext } from 'react';

// 定义上下文的值类型，状态为对象
interface GlobalState {
    canSendMsg: boolean;
    duringBuildingConversation: boolean;
}

interface GlobalContextValue {
    globalState: GlobalState;
    setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
}

// 创建一个上下文对象
const GlobalContext = createContext<GlobalContextValue | undefined>(undefined);

// 创建一个提供器组件
const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [globalState, setGlobalState] = useState<GlobalState>({
        canSendMsg: true,
        duringBuildingConversation: false
    });

    const contextValue: GlobalContextValue = {
        globalState,
        setGlobalState
    };

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
};

// 自定义 hook 用于获取上下文
const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalContext 必须在 GlobalProvider 内部使用');
    }
    return context;
};

export { GlobalContext, GlobalProvider, useGlobalContext };
    