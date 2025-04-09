import { isMobile } from '../../utils/utils';
import {
  DislikeOutlined,
  LikeOutlined,
  DownloadOutlined,
  RedoOutlined,
  FileJpgOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { MsgDataType } from '../../common/type';
import { Button } from 'antd';
import { CLS_PREFIX } from '../../common/constants';
import { useContext, useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { updateQAFeedback } from '../../service';
import { useMethodRegister } from '../../hooks';
import { ChartItemContext } from '../ChatItem';

type Props = {
  queryId: number;
  scoreValue?: number;
  isLastMessage?: boolean;
  isParserError?: boolean;
  voiceLoading?: boolean;
  isSimpleMode?: boolean;
  msgData?: MsgDataType;
  onExportData?: () => void;
  onReExecute?: (queryId: number) => void;
  onVoiceReport?: (msgData: any) => void;
  // onReadRes?: () => void;
};

const Tools: React.FC<Props> = ({
  queryId,
  scoreValue,
  isLastMessage,
  msgData,
  isParserError = false,
  voiceLoading = false,
  isSimpleMode = false,
  onExportData,
  onReExecute,
  onVoiceReport,
  // onReadRes
}) => {
  const [score, setScore] = useState(scoreValue || 0);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const prefixCls = `${CLS_PREFIX}-tools`;

  const like = () => {
    setScore(5);
    updateQAFeedback(queryId, 5);
  };

  const dislike = () => {
    setScore(1);
    updateQAFeedback(queryId, 1);
  };

  const likeClass = classNames(`${prefixCls}-like`, {
    [`${prefixCls}-feedback-active`]: score === 5,
  });
  const dislikeClass = classNames(`${prefixCls}-dislike`, {
    [`${prefixCls}-feedback-active`]: score === 1,
  });

  const { call } = useContext(ChartItemContext);
  
  // useEffect(() => {
  //   // 当data变化时，这个函数会被调用
  //   // handleDataChange(data);
  //   setExportLoading(voiceLoading);
  // }, [voiceLoading]);

  useEffect(() => {
    // const wavId = sessionStorage.getItem('voiceReportId')
    // if (!wavId) {
    //   sessionStorage.setItem('voiceReportId', '1')
    // }
    const isIOS = window.navigator.userAgent.match(/(iPhone|iPod|ios)/i);
    if (msgData?.ttsUrl && !isIOS) {
      setExportLoading(true)
      // @ts-ignore
      // const vId = sessionStorage.getItem('voiceReportId') || 0
      // const length = msgData?.textSummary?.length || 0
      // 字数时间补偿,文本越长,补偿时间越多,loading的时间就越多
      setTimeout(() => {
        // @ts-ignore
        setExportLoading(false)
      }, 500)
    }
  }, [msgData?.ttsUrl]);

  // const showTip = useRef(false)
  // useEffect(() => {
  //   // sessionStorage.setItem('loadVoiceData', 'true')
  //   // 当data变化时，这个函数会被调用
  //   // const oaAccount = localStorage.getItem('oaAccount');
  //   // const accountList = ['liqianqianjs', 'liqianqian', 'jiangjiqi', 'jiangjiqipt', 'liaokun', 'liaokun_pt', 'zhouzhou_pt', 'zhouzhou']
  //   // // @ts-ignore
  //   // if (accountList.indexOf(oaAccount) > -1) {
  //   //   showTip.current = true
  //   // }
  //   // // 全部打开弹窗,部署在redred环境,不影响正式环境的功能
  //   // showTip.current = true
  // }, []);
  
  
  // 从Tools中触发点击事件传递到ChatItem在从ChatItem中触发MessageContainer的voiceReport函数
  const voiceReport = (msgData: any = {}) => {
    // @ts-ignore
    const playAnimation = () => {
      const iconList = document.getElementsByClassName(`voice-icon`)
      if (iconList.length > 0) {
        Array.from(iconList).forEach(element => {
          element.classList.remove('voice-icon')
        })
      }
      // 播放成功，添加播放动效，停止loading效果
      const vIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
      vIcon?.classList?.add('voice-icon')
    }
    if (sessionStorage.getItem('isInIframe') === 'true') {
      // 从iframe中引用访问，播报使用parent内audio
      // 点击播放按钮，触发语音播放
      playAnimation()
      window.parent.postMessage({ action: 'voicePlay', msgData }, '*');
    } else {
      let player = document.getElementsByClassName('voiceReportPlayer')[0]
      if (player) {
        // @ts-ignore
        if (!player.paused && player.dataset.index === `${msgData.queryId}`) {
          // @ts-ignore
          player.pause()
          const vIcon = document.getElementsByClassName('voice-icon')[0];
          vIcon?.classList?.remove('voice-icon')
          return
        }
        // @ts-ignore
        player.src = msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443')
        // @ts-ignore
        player.play()
        // @ts-ignore
        player.dataset.index = `${msgData.queryId}`
        playAnimation()
      } else {
        // 非iframe中引用访问，播报使用本项目内audio
        const pageRoot = document.getElementById('root')
        // 播放成功，添加播放动效，停止loading效果
        player = new Audio(msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443'))
        pageRoot?.appendChild(player)
        // @ts-ignore
        player.style.width = '0'
        // @ts-ignore
        player.style.height = '0'
        // @ts-ignore
        player.style.position = 'absolute'
        player.classList.add('voiceReportPlayer')
        // @ts-ignore
        player.play()
        // @ts-ignore
        player.dataset.index = `${msgData.queryId}`
        playAnimation()
      }
      player.addEventListener('ended', () => {
        const vIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
        const audioEle = document.getElementsByClassName('voiceReportPlayer')[0];
        vIcon?.classList?.remove('voice-icon')
        // @ts-ignore
        audioEle.dataset.index = ''
      }, { once: true });
      player.addEventListener('timeupdate', function() {
        // @ts-ignore
        if (player.currentTime === player.duration) {
          // 您可以在这里添加其他逻辑，例如更新进度条或显示剩余时间等。
          const icon = document.getElementsByClassName(`voice-icon`)
          // icon?.classList?.remove('voice-icon')
          Array.from(icon).forEach(ele => {
            ele.classList.remove('voice-icon')
          })
          const audioEle = document.getElementsByClassName('voiceReportPlayer')[0];
          // @ts-ignore
          audioEle.dataset.index = ''
        }
      }, { once: true })
    }
  }

  return (
    <div className={prefixCls}>
      {/* !isMobile && */}
      {(
        <div className={`${prefixCls}-feedback`}>
          {/* <div>这个回答正确吗？</div> */}

          <div className={`${prefixCls}-feedback-left`}>
            {(!isParserError && msgData?.textSummary && msgData?.ttsUrl) && (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    // setExportLoading(true);
                    voiceReport(msgData);
                  }}
                  type="text"
                  loading={ exportLoading }
                  // loading={`${msgData?.queryId}` === sessionStorage.getItem('voiceReportQueryId') ? exportLoading : false}
                >
                  <SoundOutlined className={`voice-icon-${msgData.queryId} voice-icon-default`} />
                  {/* <span className={`${prefixCls}-font-style`}>语音播放</span> */}
                  <span className={`${prefixCls}-font-style`}></span>
                </Button>
                {!isMobile && (
                  <Button
                    size="small"
                    onClick={() => {
                      // setExportLoading(true);
                      onExportData?.();
                      // setTimeout(() => {
                      //   setExportLoading(false);
                      // }, 1000);
                    }}
                    type="text"
                    loading={exportLoading}
                  >
                    <DownloadOutlined />
                    <span className={`${prefixCls}-font-style`}>导出数据</span>
                  </Button>
                )}
                {!isMobile && !isSimpleMode && (
                  <Button
                    size="small"
                    onClick={() => {
                      call('downloadChartAsImage');
                    }}
                    type="text"
                  >
                    <FileJpgOutlined />
                    <span className={`${prefixCls}-font-style`}>导出图片</span>
                  </Button>
                )}
                {!isMobile && isLastMessage && (
                  <Button
                    size="small"
                    onClick={() => {
                      onReExecute?.(queryId);
                    }}
                    type="text"
                  >
                    <RedoOutlined />
                    <span className={`${prefixCls}-font-style`}>再试一次</span>
                  </Button>
                )}
              </>
            )}
          </div>
          <div className={`${prefixCls}-feedback-left`}>
            <LikeOutlined className={likeClass} onClick={like} style={{ marginRight: 10 }} />
            <DislikeOutlined
              className={dislikeClass}
              onClick={e => {
                e.stopPropagation();
                dislike();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
