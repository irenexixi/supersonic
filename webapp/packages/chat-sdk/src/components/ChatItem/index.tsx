import {
  ChatContextType,
  DateInfoType,
  EntityInfoType,
  FilterItemType,
  MsgDataType,
  ParseStateEnum,
  ParseTimeCostType,
  RangeValue,
  SimilarQuestionType,
} from '../../common/type';
import { createContext, useEffect, useRef, useState, ReactNode } from 'react';
import { chatExecute, dataInterpret, chatParse, queryData, deleteQuery, switchEntity,queryThoughtsInSSE } from '../../service';
import { PARSE_ERROR_TIP, PREFIX_CLS, SEARCH_EXCEPTION_TIP } from '../../common/constants';
import { message, Spin } from 'antd';
import { fetch } from 'umi-request';
import { CheckCircleFilled } from '@ant-design/icons';
// import IconFont from '../IconFont';
// import ExpandParseTip from './ExpandParseTip';
// import ParseTip from './ParseTip';
import ExecuteItem from './ExecuteItem';
import { isMobile } from '../../utils/utils';
import classNames from 'classnames';
import Tools from '../Tools';
// import SqlItem from './SqlItem';
// import SimilarQuestionItem from './SimilarQuestionItem';
import { AgentType } from '../../Chat/type';
import dayjs, { Dayjs } from 'dayjs';
import { exportCsvFile } from '../../utils/utils';
import Loading from './Loading';
import { useGlobalContext } from '../../context/GlobalContext';
import { set } from 'lodash';
// import { useMethodRegister } from '../../hooks';

type Props = {
  msgId?: string | number;
  msg: string;
  conversationId?: number;
  questionId?: number;
  modelId?: number;
  agentId?: number;
  score?: number;
  filter?: any[];
  parseInfos?: ChatContextType[];
  parseTimeCostValue?: ParseTimeCostType;
  msgData?: MsgDataType;
  triggerResize?: boolean;
  isDeveloper?: boolean;
  curItemIndex?: number;
  onVoiceReport?: (msgData: any) => void;
  itemVoiceLoading?: boolean;
  integrateSystem?: string;
  executeItemNode?: React.ReactNode;
  renderCustomExecuteNode?: boolean;
  isSimpleMode?: boolean;
  isDebugMode?: boolean;
  currentAgent?: AgentType;
  isLastMessage?: boolean;
  onMsgDataLoaded?: (data: MsgDataType, valid: boolean, isRefresh?: boolean) => void;
  onUpdateMessageScroll?: () => void;
  onSendMsg?: (msg: string) => void;
  onCouldNotAnswer?: () => void;
};

export const ChartItemContext = createContext({
  register: (...args: any[]) => {},
  call: (...args: any[]) => {},
});

const ChatItem: React.FC<Props> = ({
  msgId = '',
  msg,
  conversationId,
  questionId,
  modelId,
  agentId,
  score,
  filter,
  triggerResize,
  parseInfos,
  parseTimeCostValue,
  msgData,
  isDeveloper,
  itemVoiceLoading,
  curItemIndex,
  onVoiceReport,
  // integrateSystem,
  executeItemNode,
  renderCustomExecuteNode,
  isSimpleMode,
  currentAgent,
  // isDebugMode,
  isLastMessage,
  onMsgDataLoaded,
  onUpdateMessageScroll,
  onSendMsg,
  onCouldNotAnswer = () => {},
}) => {
  const [parseLoading, setParseLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDataInterpret, setIsDataInterpret] = useState(false);
  const [parseTimeCost, setParseTimeCost] = useState<ParseTimeCostType>();
  const [parseInfo, setParseInfo] = useState<ChatContextType>();
  const [parseInfoOptions, setParseInfoOptions] = useState<ChatContextType[]>([]);
  const [preParseInfoOptions, setPreParseInfoOptions] = useState<ChatContextType[]>([]);
  const [parseTip, setParseTip] = useState('');
  const [executeMode, setExecuteMode] = useState(false);
  const [preParseMode, setPreParseMode] = useState(false);
  const [showExpandParseTip, setShowExpandParseTip] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeTip, setExecuteTip] = useState('');
  const [executeErrorMsg, setExecuteErrorMsg] = useState('');
  const [data, setData] = useState<MsgDataType>();
  const [entitySwitchLoading, setEntitySwitchLoading] = useState(false);
  const [dimensionFilters, setDimensionFilters] = useState<FilterItemType[]>([]);
  const [dateInfo, setDateInfo] = useState<DateInfoType>({} as DateInfoType);
  const [entityInfo, setEntityInfo] = useState<EntityInfoType>({} as EntityInfoType);
  const [dataCache, setDataCache] = useState<Record<number, { tip: string; data?: MsgDataType }>>(
    {}
  );
  const [isParserError, setIsParseError] = useState<boolean>(false);
  const isThinkingRef = useRef(isThinking);
  const { setGlobalState, globalState } = useGlobalContext();
  const canSendMsgRef = useRef(globalState.canSendMsg);
  const resetState = () => {
    setParseLoading(false);
    setParseTimeCost(undefined);
    setParseInfo(undefined);
    setParseInfoOptions([]);
    setPreParseMode(false);
    setShowExpandParseTip(false);
    setPreParseInfoOptions([]);
    setParseTip('');
    setExecuteMode(false);
    setDimensionFilters([]);
    setData(undefined);
    setExecuteErrorMsg('');
    setDateInfo({} as DateInfoType);
    setEntityInfo({} as EntityInfoType);
    setDataCache({});
    setIsParseError(false);
  };

  const prefixCls = `${PREFIX_CLS}-item`;

  const getNodeTip = (title: ReactNode, tip?: string | ReactNode) => {
    return (
      <>
        <div className={`${prefixCls}-title-bar`}>
          <CheckCircleFilled className={`${prefixCls}-step-icon`} />
          <div className={`${prefixCls}-step-title`}>
            {title}
            {!tip && <Loading />}
          </div>
        </div>
        {tip && <div className={`${prefixCls}-content-container`}>{tip}</div>}
      </>
    );
  };

  const updateData = (res: Result<MsgDataType>) => {
    let tip: string = '';
    let data: MsgDataType | undefined = undefined;
    const { queryColumns, queryResults, queryState, queryMode, response, chatContext, errorMsg } =
      res.data || {};
    setExecuteErrorMsg(errorMsg);
    if (res.code === 400 || res.code === 401 || res.code === 412) {
      tip = res.msg;
    } else if (res.code !== 200) {
      tip = SEARCH_EXCEPTION_TIP;
    } else if (queryState !== 'SUCCESS') {
      tip = response && typeof response === 'string' ? response : SEARCH_EXCEPTION_TIP;
    } else if (
      (queryColumns && queryColumns.length > 0 && queryResults) ||
      queryMode === 'WEB_PAGE' ||
      queryMode === 'WEB_SERVICE' ||
      queryMode === 'PLAIN_TEXT'
    ) {
      data = res.data;
      tip = '';
    }
    if (chatContext) {
      setDataCache({ ...dataCache, [chatContext!.id!]: { tip, data } });
    }
    if (data) {
      setData(data);
      setExecuteTip('');
      return true;
    }
    setExecuteTip(tip || SEARCH_EXCEPTION_TIP);
    return false;
  };

  const onExecute = async (
    parseInfoValue: ChatContextType,
    parseInfos?: ChatContextType[],
    isSwitchParseInfo?: boolean,
    isRefresh = false
  ) => {
    setExecuteMode(true);
    if (isSwitchParseInfo) {
      setEntitySwitchLoading(true);
    } else {
      setExecuteLoading(true);
    }
    try {
      const res: any = await chatExecute(msg, conversationId!, parseInfoValue, agentId);
      const valid = updateData(res);
      onMsgDataLoaded?.(
        {
          ...res.data,
          parseInfos,
          queryId: parseInfoValue.queryId,
        },
        valid,
        isRefresh
      );
      // 没有回答上会显示一遍推荐问题
      if(res?.data?.chatContext?.sqlInfo?.resultType === 'text' 
        || !(res?.data?.queryResults)
        || res?.data?.queryResults?.length === 0
      ) {
        onCouldNotAnswer()
      }
      setGlobalState((prev)=>{
        return {
          ...prev,
          canSendMsg: true,
        }
      })
      // 如果开启了数据解读功能，会调用数据解释接口，获取数据解释结果
      if (currentAgent?.chatAppConfig?.DATA_INTERPRETER?.enable) {
        setGlobalState((prev)=>{
          return {
            ...prev,
            canSendMsg: false,
          }
        })
        setIsDataInterpret(true);
        setTimeout(async()=>{
          try{
            const resOfSummary:any = await dataInterpret(res?.data?.textResult || '' ,msg, conversationId!, parseInfoValue, agentId)
            if(res?.data){
              res.data.textSummary = resOfSummary?.data?.textSummary
            }
            // 暂停缓存语音
            // cacheVoiceData(resOfSummary.data?.ttsUrl)
            // 此处ttsUrl赋值，语音播报功能能够实现，但是本文件onMsgDataLoaded多个,并未对ttsUrl赋值，不知道有无影响？？？？
            onMsgDataLoaded?.(
              {
                ...res.data,
                ttsUrl: resOfSummary.data?.ttsUrl,
                parseInfos,
                queryId: parseInfoValue.queryId,
              },
              valid,
              isRefresh
            );
            onUpdateMessageScroll?.()
            // 这里需要再执行一遍显示推荐问题，不然推荐问题会消失
            if(res?.data?.chatContext?.sqlInfo?.resultType === 'text' 
              || !(res?.data?.queryResults)
              || res?.data?.queryResults?.length === 0
            ) {
              onCouldNotAnswer()
            }
            setGlobalState((prev)=>{
              return {
                ...prev,
                canSendMsg: true,
              }
            })
          } catch(err) {
            setGlobalState((prev)=>{
              return {
                ...prev,
                canSendMsg: true,
              }
            })
            throw(err)
          } finally {
            setIsDataInterpret(false)
          }
        },0)
      }
    } catch (e) {
      onCouldNotAnswer()
      const tip = SEARCH_EXCEPTION_TIP;
      setExecuteTip(SEARCH_EXCEPTION_TIP);
      setDataCache({ ...dataCache, [parseInfoValue!.id!]: { tip } });
      setGlobalState((prev)=>{
        return {
          ...prev,
          canSendMsg: true,
        }
      })
    }
    if (isSwitchParseInfo) {
      setEntitySwitchLoading(false);
    } else {
      setExecuteLoading(false);
    }
  };

  const updateDimensionFitlers = (filters: FilterItemType[]) => {
    setDimensionFilters(
      filters.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      })
    );
  };

  const sendMsg = async () => {
    setGlobalState((prev)=>{
      return {
        ...prev,
        canSendMsg: false,
      }
    })
    const responseDiv = document.getElementById('thoughts-response-'+msgId)
    if (responseDiv) {
      responseDiv.textContent = ''
      let time = 0;
      const messageFunc = (event) => {
        setTimeout(() => {
          responseDiv.textContent += event.data
          responseDiv.scrollTop = responseDiv.scrollHeight;
        },time)
        time += 200
      }
      const errorFunc = (error) => {
        setIsThinking(false)
        console.error('SSE 错误:', error);
        throw error
      };
      const closeFunc = () => {
        setTimeout(() => {
          setIsThinking(false)
        },time)
        console.log('SSE 连接已关闭');
      };
      setIsThinking(true)
      queryThoughtsInSSE(msg,conversationId,agentId,messageFunc,errorFunc,closeFunc)
    }
    setParseLoading(true);
    let parseData: any = {};
    try {
      parseData = await chatParse({
        queryText: msg,
        chatId: conversationId,
        modelId,
        agentId,
        filters: filter,
      });
      if(!(parseData?.data?.state === 'COMPLETED')) {
        onCouldNotAnswer()
      }
    } catch (error) {
      onCouldNotAnswer()
      setGlobalState((prev)=>{
        return {
          ...prev,
          canSendMsg: true,
        }
      })
      return
    }
    // 预设问题如果包含该提问，让其结果在思考后才出结果
    if (currentAgent?.examples.includes(msg)) {
      await new Promise(resolve => {
        let step = 0
        let timer = setInterval(() => {
          step ++
          if (!isThinkingRef.current) {
            resolve(true)
            clearInterval(timer)
          } else {
            if (step >= 50) {
              resolve(true)
              clearInterval(timer)
            }
          } 
        }, 200)
      });
    }
    setParseLoading(false);
    const { code, data } = parseData || {};
    const { state, selectedParses, candidateParses, queryId, parseTimeCost, errorMsg } = data || {};
    const parses = selectedParses?.concat(candidateParses || []) || [];
    if (
      code !== 200 ||
      state === ParseStateEnum.FAILED ||
      !parses.length ||
      (!parses[0]?.properties?.type && !parses[0]?.queryMode)
    ) {
      setParseTip(state === ParseStateEnum.FAILED && errorMsg ? errorMsg : PARSE_ERROR_TIP);

      setParseInfo({ queryId } as any);
      setGlobalState((prev)=>{
        return {
          ...prev,
          canSendMsg: true,
        }
      })
      return;
    }
    onUpdateMessageScroll?.();
    const parseInfos = parses.slice(0, 5).map((item: any) => ({
      ...item,
      queryId,
    }));
    if (parseInfos.length > 1) {
      setPreParseInfoOptions(parseInfos);
      setShowExpandParseTip(true);
      setPreParseMode(true);
    }
    setParseInfoOptions(parseInfos || []);
    const parseInfoValue = parseInfos[0];
    if (!(currentAgent?.enableFeedback === 1 && parseInfos.length > 1)) {
      setParseInfo(parseInfoValue);
    }
    setParseTimeCost(parseTimeCost);
    setEntityInfo(parseInfoValue.entityInfo || {});
    updateDimensionFitlers(parseInfoValue?.dimensionFilters || []);
    setDateInfo(parseInfoValue?.dateInfo);
    if (parseInfos.length === 1) {
      onExecute(parseInfoValue, parseInfos);
    } else {
      setGlobalState((prev)=>{
        return {
          ...prev,
          canSendMsg: true,
        }
      })
    }
  };

  const initChatItem = (msg, msgData) => {
    if (msgData) {
      const parseInfoOptionsValue =
        parseInfos && parseInfos.length > 0
          ? parseInfos.map(item => ({ ...item, queryId: msgData.queryId }))
          : [{ ...msgData.chatContext, queryId: msgData.queryId }];
      const parseInfoValue = parseInfoOptionsValue[0];
      setParseInfoOptions(parseInfoOptionsValue);
      setParseInfo(parseInfoValue);
      setParseTimeCost(parseTimeCostValue);
      updateDimensionFitlers(parseInfoValue.dimensionFilters || []);
      setDateInfo(parseInfoValue.dateInfo);
      setExecuteMode(true);
      updateData({ code: 200, data: msgData, msg: 'success' });
    } else if (msg) {
      sendMsg();
    }
  };

  useEffect(() => {
    if (data !== undefined || executeTip !== '' || parseLoading) {
      return;
    }
    initChatItem(msg, msgData);
  }, [msg, msgData]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    canSendMsgRef.current = globalState.canSendMsg;
  }, [globalState.canSendMsg]);

  const voiceReport = (msgData: any = {}) => {
    if (onVoiceReport) {
      onVoiceReport?.(msgData)
      return
    }
    // setItemVoiceLoading(true)
    // const voicePlay = function(msgData: any = {}) {
    //   const audioElementCur = document.getElementsByClassName('voiceReportPlayer');
    //   // iconList拿到正在播放的voice
    //   const iconList = document.getElementsByClassName(`voice-icon`)
    //   // 有正在播放的,停止播放并且清除样式,且不再继续执行
    //   if (iconList.length > 0) {
    //       // @ts-ignore
    //       audioElementCur[0].pause()
    //       iconList[0]?.classList.remove('voice-icon')
    //       // @ts-ignore
    //       if (audioElementCur[0].dataset.index === `${msgData.queryId}`) {
    //         setTimeout(() => {
    //           setItemVoiceLoading(false)
    //         }, 100)
    //         return
    //       }
    //   }
    //   const urlNew = msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443')
    //   const res = {data: urlNew}
    //   if (res && res.data) {
    //     // setTimeout(() => {
    //       // 延迟关闭loading效果，delay时间视作加载语音耗时
    //       // setItemVoiceLoading(false)
    //     // }, 1000)
    //     const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
    //     const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
    //     // @ts-ignore
    //     if (audioElement && voicingIcon) {
    //       // @ts-ignore
    //       audioElement.src = res.data
    //       // @ts-ignore
    //       audioElement.load()
    //       // @ts-ignore
    //       // audioElement.play();
    //       // voicingIcon.classList.add('voice-icon')
    //       // @ts-ignore
    //       audioElement.dataset.index = msgData.queryId
    //       // 检测是否完全加载
    //       // @ts-ignore
    //       // function checkIfFullyLoaded() {
    //       //   // @ts-ignore
    //       //   if (audioElement.readyState >= 4) { // HAVE_ENOUGH_DATA
    //       //     console.log("redChat loadedmetadata 音频完全加载");
    //       //     // @ts-ignore
    //       //     audioElement.play().catch(e => console.error("redChat 播放失败:", e));
    //       //   } else {
    //       //     setTimeout(checkIfFullyLoaded, 500); // 每隔 500ms 检查一次
    //       //   }
    //       // }
    //       // audioElement.addEventListener("loadedmetadata", () => {
    //       //   checkIfFullyLoaded(); // 开始检查
    //       // });
    //       // 监听 'canplaythrough' 事件（表示可以完整播放）
    //       const oaAccount = localStorage.getItem('oaAccount');
    //       const accountList = ['liqianqianjs', 'liqianqian', 'jiangjiqi', 'jiangjiqi_pt', 'liaokun', 'liaokun_pt']
    //       let showTip = false
    //       // @ts-ignore
    //       if (accountList.indexOf(oaAccount) > -1) {
    //         showTip = true
    //       }
    //       audioElement.addEventListener("canplaythrough", () => {
    //         console.log("redChat canplaythrough 音频已完全加载，开始播放");
    //         showTip && message.success('即将为您播报语音');
    //         // 延迟关闭loading效果，delay时间视作加载语音耗时
    //         setItemVoiceLoading(false)
    //         voicingIcon.classList.add('voice-icon')
    //         // @ts-ignore
    //         audioElement.play().catch(e => {
    //           showTip && message.error('自动播放失败，需要用户交互');
    //           console.error("redChat 自动播放失败，需要用户交互:", e);
    //           voicingIcon.classList.remove('voice-icon')
    //           // 提示用户点击页面以播放
    //           document.body.addEventListener("click", () => {
    //               // @ts-ignore
    //               audioElement.play() 
    //             }, { once: true });
    //         });
    //       });

    //       // 错误处理
    //       audioElement.addEventListener("error", () => {
    //         showTip && message.error('音频文件生成中，请稍后再试');
    //         setItemVoiceLoading(false)
    //       }); 

    //       const handleEndedWrapper = function() {
    //         handleEnded(voicingIcon, audioElement)
    //       }
    //       const handleEnded = function(icon, audio) {
    //         // @ts-ignore
    //         icon?.classList?.remove('voice-icon')
    //         audio.dataset.index = ''
    //       }
    //       audioElement.addEventListener('ended', handleEndedWrapper)
    //     }
    //   }
    // }
    // // 延迟3000ms播放,安卓加载异常问题尝试修复
    // // 暂停播放时不延迟
    // const iconList = document.getElementsByClassName(`voice-icon`)
    // if (iconList.length > 0) {
    //   voicePlay(msgData)
    // } else {
    //   setTimeout(() => {
    //     voicePlay(msgData)
    //   }, 3000)
    // }
  }
  const onSwitchEntity = async (entityId: string) => {
    setEntitySwitchLoading(true);
    const res = await switchEntity(entityId, data?.chatContext?.modelId, conversationId || 0);
    setEntitySwitchLoading(false);
    setData(res.data);
    const { chatContext, entityInfo } = res.data || {};
    const chatContextValue = { ...(chatContext || {}), queryId: parseInfo?.queryId };
    setParseInfo(chatContextValue);
    setEntityInfo(entityInfo);
    updateDimensionFitlers(chatContextValue?.dimensionFilters || []);
    setDateInfo(chatContextValue?.dateInfo);
    setDataCache({ ...dataCache, [chatContextValue.id!]: { tip: '', data: res.data } });
  };

  const onFiltersChange = (dimensionFilters: FilterItemType[]) => {
    setDimensionFilters(dimensionFilters);
  };

  const onDateInfoChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const [start, end] = dates;
      setDateInfo({
        ...(dateInfo || {}),
        startDate: dayjs(start).format('YYYY-MM-DD'),
        endDate: dayjs(end).format('YYYY-MM-DD'),
        dateMode: 'BETWEEN',
        unit: 0,
      });
    }
  };

  const handlePresetClick = (range: RangeValue) => {
    setDateInfo({
      ...(dateInfo || {}),
      startDate: dayjs(range[0]).format('YYYY-MM-DD'),
      endDate: dayjs(range[1]).format('YYYY-MM-DD'),
      dateMode: 'BETWEEN',
      unit: 0,
    });
  };

  const onRefresh = async (parseInfoValue?: ChatContextType) => {
    setEntitySwitchLoading(true);
    const { dimensions, metrics, id, queryId } = parseInfoValue || parseInfo || {};
    const chatContextValue = {
      dimensions,
      metrics,
      dateInfo,
      dimensionFilters,
      parseId: id,
      queryId,
    };
    const res: any = await queryData(chatContextValue);
    setEntitySwitchLoading(false);
    if (res.code === 200) {
      const resChatContext = res.data?.chatContext;
      const contextValue = { ...(resChatContext || chatContextValue), queryId };
      const dataValue = {
        ...res.data,
        chatContext: contextValue,
        parseInfos: parseInfoOptions,
        queryId,
      };
      onMsgDataLoaded?.(dataValue, true, true);
      setData(dataValue);
      setParseInfo(contextValue);
      setDataCache({ ...dataCache, [id!]: { tip: '', data: dataValue } });
    }
  };

  const deleteQueryInfo = async (queryId: number) => {
    const { code }: any = await deleteQuery(queryId);
    if (code === 200) {
      resetState();
      initChatItem(msg, undefined);
    }
  };

  const onSelectParseInfo = async (parseInfoValue: ChatContextType) => {
    setParseInfo(parseInfoValue);
    updateDimensionFitlers(parseInfoValue.dimensionFilters || []);
    setDateInfo(parseInfoValue.dateInfo);
    if (parseInfoValue.entityInfo) {
      setEntityInfo(parseInfoValue.entityInfo);
    }
    if (dataCache[parseInfoValue.id!]) {
      const { tip, data } = dataCache[parseInfoValue.id!];
      setExecuteTip(tip);
      setData(data);
      onMsgDataLoaded?.(
        {
          ...(data as any),
          parseInfos,
          queryId: parseInfoValue.queryId,
        },
        true,
        true
      );
    } else {
      onExecute(parseInfoValue, parseInfoOptions, true);
    }
  };

  const onExpandSelectParseInfo = async (parseInfoValue: ChatContextType) => {
    setParseInfo(parseInfoValue);
    setPreParseMode(false);
    const { id: parseId, queryId } = parseInfoValue;
    setParseLoading(true);
    const { code, data }: any = await chatParse({
      queryText: msg,
      chatId: conversationId,
      modelId,
      agentId,
      filters: filter,
      parseId,
      queryId,
      parseInfo: parseInfoValue,
    });
    setParseLoading(false);
    if (code === 200) {
      setParseTimeCost(data.parseTimeCost);
      const parseInfo = data.selectedParses[0];
      parseInfo.queryId = data.queryId;
      setParseInfoOptions([parseInfo]);
      setParseInfo(parseInfo);
      updateDimensionFitlers(parseInfo.dimensionFilters || []);
      setDateInfo(parseInfo.dateInfo);
      if (parseInfo.entityInfo) {
        setEntityInfo(parseInfo.entityInfo);
      }
      onExecute(parseInfo, [parseInfo], true, true);
    }
  };

  const onExportData = () => {
    const { queryColumns, queryResults } = data || {};
    if (!!queryResults) {
      const exportData = queryResults.map(item => {
        return Object.keys(item).reduce((result, key) => {
          const columnName = queryColumns?.find(column => column.nameEn === key)?.name || key;
          result[columnName] = item[key];
          return result;
        }, {});
      });
      exportCsvFile(exportData);
    }
  };

  const onSelectQuestion = (question: SimilarQuestionType) => {
    onSendMsg?.(question.queryText);
  };

  const contentClass = classNames(`${prefixCls}-content`, {
    [`${prefixCls}-content-mobile`]: isMobile,
  });

  // const { llmReq, llmResp } = parseInfo?.properties?.CONTEXT || {};

  // const { register, call } = useMethodRegister(() => message.error('该条消息暂不支持该操作'));

  return (
    // <ChartItemContext.Provider value={{ register, call }}>

    // </ChartItemContext.Provider>
    <div className={prefixCls}>
    {/* {!isMobile && <IconFont type="icon-zhinengsuanfa" className={`${prefixCls}-avatar`} />} */}
    <div className={isMobile ? `${prefixCls}-mobile-msg-card` : ''}>
      {/* <div className={`${prefixCls}-time`}>
        {parseTimeCost?.parseStartTime
          ? dayjs(parseTimeCost.parseStartTime).format('M月D日 HH:mm')
          : ''}
      </div> */}
      <div className={contentClass}>
        {/* <>
          {currentAgent?.enableFeedback === 1 && !questionId && showExpandParseTip && (
            <div style={{ marginBottom: 10 }}>
              <ExpandParseTip
                isSimpleMode={isSimpleMode}
                parseInfoOptions={preParseInfoOptions}
                agentId={agentId}
                integrateSystem={integrateSystem}
                parseTimeCost={parseTimeCost?.parseTime}
                isDeveloper={isDeveloper}
                onSelectParseInfo={onExpandSelectParseInfo}
                onSwitchEntity={onSwitchEntity}
                onFiltersChange={onFiltersChange}
                onDateInfoChange={onDateInfoChange}
                onRefresh={onRefresh}
                handlePresetClick={handlePresetClick}
              />
            </div>
          )}

          {!preParseMode && (
            <ParseTip
              isSimpleMode={isSimpleMode}
              parseLoading={parseLoading}
              parseInfoOptions={parseInfoOptions}
              parseTip={parseTip}
              currentParseInfo={parseInfo}
              agentId={agentId}
              dimensionFilters={dimensionFilters}
              dateInfo={dateInfo}
              entityInfo={entityInfo}
              integrateSystem={integrateSystem}
              parseTimeCost={parseTimeCost?.parseTime}
              isDeveloper={isDeveloper}
              onSelectParseInfo={onSelectParseInfo}
              onSwitchEntity={onSwitchEntity}
              onFiltersChange={onFiltersChange}
              onDateInfoChange={onDateInfoChange}
              onRefresh={() => {
                onRefresh();
              }}
              handlePresetClick={handlePresetClick}
            />
          )}
        </> */}

        {isThinking && getNodeTip('深度思考中')}
        <div id={'thoughts-response-' + msgId} className='thoughts-container'></div>
        {executeMode && (
          <Spin spinning={entitySwitchLoading}>
            <div style={{ minHeight: 50 }}>
              {/* {!isMobile &&
                parseInfo?.sqlInfo &&
                isDeveloper &&
                isDebugMode &&
                !isSimpleMode && (
                  <SqlItem
                    agentId={agentId}
                    queryId={parseInfo.queryId}
                    question={msg}
                    llmReq={llmReq}
                    llmResp={llmResp}
                    integrateSystem={integrateSystem}
                    queryMode={parseInfo.queryMode}
                    sqlInfo={parseInfo.sqlInfo}
                    sqlTimeCost={parseTimeCost?.sqlTime}
                    executeErrorMsg={executeErrorMsg}
                  />
                )} */}
              <ExecuteItem
                isSimpleMode={isSimpleMode}
                queryId={parseInfo?.queryId}
                question={msg}
                queryMode={parseInfo?.queryMode}
                executeLoading={executeLoading}
                executeTip={executeTip}
                executeErrorMsg={executeErrorMsg}
                chartIndex={0}
                data={data}
                triggerResize={triggerResize}
                executeItemNode={executeItemNode}
                isDeveloper={isDeveloper}
                renderCustomExecuteNode={renderCustomExecuteNode}
                isDataInterpret={isDataInterpret}
              />
            </div>
          </Spin>
        )}
        {/* {executeMode &&
          !executeLoading &&
          !isSimpleMode &&
          parseInfo?.queryMode !== 'PLAIN_TEXT' && (
            <SimilarQuestionItem
              queryId={parseInfo?.queryId}
              defaultExpanded={parseTip !== '' || executeTip !== ''}
              similarQueries={data?.similarQueries}
              onSelectQuestion={onSelectQuestion}
            />
          )} */}
      </div>
      {(parseTip !== '' || (executeMode && !executeLoading)) &&
        parseInfo?.queryMode !== 'PLAIN_TEXT' && (
          <Tools
            isLastMessage={isLastMessage}
            queryId={parseInfo?.queryId || 0}
            scoreValue={score}
            isParserError={isParserError}
            msgData={msgData}
            voiceLoading={itemVoiceLoading}
            onExportData={() => {
              onExportData();
            }}
            isSimpleMode={isSimpleMode}
            onReExecute={queryId => {
              deleteQueryInfo(queryId);
            }}
            onVoiceReport={(msgData: any) => {
              voiceReport(msgData)
            }}
          />
        )}
    </div>
  </div>
  );
};

export default ChatItem;
