import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Image } from 'antd';
import Recorder from 'js-audio-recorder';
import { voiceIat } from '../../service';
import { CloseOutlined } from '@ant-design/icons';

// let voiceTimeout = null
const VoiceInput = ({ onCallback }) => {
  const [isRecording, setIsRecording] = useState(false);
  const voiceTimeout = useRef(null)
  const buttonRef = useRef(null);
  const cancelRef = useRef<HTMLDivElement>(null);
  const cancelRequest = useRef(false);

  
  const recorderFn = {
    isIE: () => { // ie?
        // @ts-ignore
        if (!!window.ActiveXObject || 'ActiveXObject' in window) {
            return true
        } else {
            return false
        }
    },
    audioStart: (recorder) => {
        if (!recorderFn) return
        if (recorderFn.isIE()) {
            console.error('ie不支持麦克风录音，请更换浏览器！')
        } else {
            recorder.start().then(() => {
                recorderFn.audioLength(recorder)
            }, (error) => {
                // 出错了
                console.log(`${error.name} : ${error.message}`)
            })
        }
    },
    audioStop: (recorder) => {
        recorder.stop()
    },
    audioLength: (recorder) => {
        // console.log('LengthLengthLengthLengthLengthLength', recorder)
        recorder.onprogress = function (params) {
          if (`${params.duration}`.includes('4.0') || `${params.duration}`.includes('1.0') || `${params.duration}`.includes('2.0') || `${params.duration}`.includes('3.0')) {
            console.log(' recorder.onprogress', params)
          }
            // const id = document.getElementById("len")
            // id.innerHTML = "录音时长：" + params.duration.toFixed(2)
            // const idx = document.getElementById("loud")
            // idx.innerHTML = "音量大小：" + params.vol.toFixed(0) + "%"
        }
    },
    audioPlay: (recorder) => {
        // const blob = recorder.getWAVBlob()
        // const url = URL.createObjectURL(blob)
        // const audio = new Audio(url)
        
        // document.getElementById('audioPlayer').src = url
        recorder.play()
    },
    audioDownload: (recorder) => {
        // recorderFn.recorder.downloadWAV("video")
        const blob = recorder.getWAVBlob()
        console.log('audioDownload', blob)
    }
  }
  let isMediaSupport = undefined
  let recorder = new Recorder()
  
  const getMediaStream = async(alertFlag = false) => {
    console.log('点击一次，调用次数AAAAAAAAAAAAAAAAAAAAA')
    try {
      const streamObj = await navigator.mediaDevices.getUserMedia({audio: true})
      streamObj.getTracks().forEach((track) => {
          track.stop()
      })
      return true
    } catch (error) {
      console.error('无法获取麦克风权限1', error)
      alertFlag && alert('无法获取麦克风权限')
      return false
    }
  }
  const startRecordVoice = async (flag = true) => {
    if (isMediaSupport === undefined) {
        const res = await getMediaStream(flag)
        // @ts-ignore
        isMediaSupport = res
        startRecordVoice(isMediaSupport)
    } else if (isMediaSupport === true) {
        // recordingStartTimestamp.value = Date.now()

        recorder.destroy()
        // 每次点击开始录音时，重新初始化Recorder
        recorder = new Recorder({
            sampleBits: 16, // 采样位数，支持 8 或 16，默认是16
            sampleRate: 16000, // 采样率，支持 11025、16000、22050、24000、44100、48000
            numChannels: 1, // 声道，支持 1 或 2， 默认是1
            compiling: false // 是否边录边转换，默认是false
        })
        recorderFn.audioStart(recorder)
        console.log('startRecordVoice')
        setTimeout(() => {
            if (isRecording) {
              recorderFn.audioStop(recorder)
              recorderFn.audioPlay(recorder)
              recorder.destroy()
            }
        }, 120000)
    } else if (isMediaSupport === false) {
        const res = await getMediaStream(flag)
        // @ts-ignore
        isMediaSupport = res
    } else {
        console.error('无法获取麦克风权限 2')
        alert('无法获取麦克风权限 2')
    }
  }
  // 录音功能（这里仅为示例，实际录音逻辑需自行实现）
  const startRecording = () => {
    console.log('开始录音');
    setIsRecording(true);
    // 实际录音逻辑...
    startRecordVoice()
  };

  const stopRecording = () => {
    console.log('停止录音');
    setIsRecording(false);
    // 实际停止录音逻辑...
    recorderFn.audioStop(recorder)
    recorderFn.audioPlay(recorder)
    // recorder.destroy()
  };

  // 长按开始录音
  const handleTouchStart = useCallback((e) => {
    event.preventDefault()
    // 录音时暂停所有播放
    const audioElementAll = document.getElementsByClassName(`voiceReportPlayer`);
    for (let i = 0; i < audioElementAll.length; i++) {
        // @ts-ignore
          audioElementAll[i].pause()
    }
    console.log('下压触发onTouchStartonTouchStartonTouchStartonTouchStartonTouchStartonTouchStartonTouchStart', voiceTimeout.current)
    // @ts-ignore
    clearTimeout(voiceTimeout.current);
    // @ts-ignore
    // const temp =  // 延迟100ms防止点击误触
    // // @ts-ignore
    const timeoutId = setTimeout(() => {
      startRecording();
      // console.log('执行录音setVoiceTimeoutsetVoiceTimeoutsetVoiceTimeoutsetVoiceTimeoutsetVoiceTimeoutsetVoiceTimeout', voiceTimeout.current)
    }, 100)
    // @ts-ignore
    voiceTimeout.current = timeoutId
  }, []);
  
  // 移动取消录音
  const handleTouchMove = useCallback((e) => {
    event.preventDefault()
    // @ts-ignore
    // clearTimeout(voiceTimeout.current);
    // stopRecording()
    // 检查是否移动到指定DOM（这里以按钮外部为例）
    // @ts-ignore
    if (cancelRef && cancelRef.current) {
      const targetRect = cancelRef?.current?.getBoundingClientRect();
      if (!e.touches[0])
        return;
      const touchX = e.touches[0]?.clientX;
      const touchY = e.touches[0]?.clientY;
      // console.log('touchXtouchY', touchX, touchY)
      // console.log('touchXtouchY', targetRect.left, targetRect.right, targetRect.top, targetRect.bottom)
      if (
        (touchX > targetRect.left && touchX < targetRect.right) &&
        (touchY > targetRect.top && touchY < targetRect.bottom)
      ) {
        console.log('按压移动触发handleTouchMovehandleTouchMovehandleTouchMovehandleTouchMovehandleTouchMovehandleTouchMove', voiceTimeout.current)
        cancelRequest.current = true
        // @ts-ignore
        clearTimeout(voiceTimeout.current);
        stopRecording();
        // 移动到按钮外部+100距离，取消录音，不发送请求
      }
    }
  }, []);
  // 长按结束取消录音
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    console.log('释放下压动作handleTouchEndhandleTouchEndhandleTouchEndhandleTouchEnd', voiceTimeout.current)
    // @ts-ignore
    clearTimeout(voiceTimeout.current);
    stopRecording(); // 移动到按钮外部，停止录音
    // 停止录音并发送请求
    recorderFn.audioPlay(recorder)
    // @ts-ignore
    // const formData = new FormData();
    // formData.append('audio', recorder.getWAVBlob(), 'recording.wav');
    requestAnimationFrame(async () => {
      if (cancelRequest.current) {
        cancelRequest.current = false
        recorder.destroy()
        return
      }
      const blobs = recorder.getWAVBlob()
      if (blobs.size === 44) return
      const res = await voiceIat(blobs);
      recorder.destroy()
      // @ts-ignore
      if (res.code && res.code === 200) {
        console.log('voiceIat', res)
        if (!res.data) {
          // onCallback && onCallback('今天天气咋样')
          console.log(`未识别到内容，请重新录制`)
        } else {
          console.log(`录音流程完成！！！将要自动发送请求。后续需要处理,录音文本为“${res.data}”,若“”内看不到内容表示未能识别语音`)
          // onSendMsg(value.trim(), option?.dataSetId);
          onCallback && onCallback(res.data)
        }
      } else {
        console.log(`语音接口返回异常`)
      }
    });
  }, []);

   // 处理触摸事件冒泡到父元素时取消录音的情况
   const handleTouchCancelOutside = (e) => {
    // console.log('触摸事件冒泡到父元素handleToucdhCancelOutsdide', voiceTimeout.current)
    // @ts-ignore
    if (!buttonRef.current.contains(e.target)) {
      if (isRecording) {
        // @ts-ignore
        clearTimeout(voiceTimeout.current);
        stopRecording(); // 移动到按钮外部，取消录音
        requestAnimationFrame(async () => {
          const blobs = recorder.getWAVBlob()
          if (blobs.size === 44) return
          const res = await voiceIat(blobs);
          recorder.destroy()
          // @ts-ignore
          if (res.code && res.code === 200) {
            console.log('voiceIat', res)
            if (!res.data) {
              // onCallback && onCallback('今天天气咋样')
              console.log(`未识别到内容，请重新录制`)
            } else {
              console.log(`录音流程完成！！！将要自动发送请求。后续需要处理,录音文本为“${res.data}”,若“”内看不到内容表示未能识别语音`)
              // onSendMsg(value.trim(), option?.dataSetId);
              onCallback && onCallback(res.data)
            }
          } else {
            console.log(`语音接口返回异常`)
          }
        });
      }
    }
  };

  useEffect(() => {
    // 在组件挂载时添加全局触摸事件监听器
    document.addEventListener('touchmove', handleTouchCancelOutside, { passive: false });

    return () => {
      // 在组件卸载时移除全局触摸事件监听器
      document.removeEventListener('touchmove', handleTouchCancelOutside);
    };
  }, []);

  return (
    <div style={{position: 'relative', height: '44px'}}>
      {isRecording && ( 
        <div
          className="btn-touch"
          style={{position: 'absolute', bottom: '40px', right: 0, width: '100vw', height: '150px',
            WebkitUserSelect: 'none', msUserSelect: 'none', MozUserSelect: 'none',userSelect: 'none',
            backgroundImage: 'linear-gradient(0deg, #FFFFFF 0%, rgba(249,252,255,0.80) 100%)'}}
        >
          <div
            ref={cancelRef}
            style={{
              background: 'rgba(80,141,248,0.10)', border: '1px solid #C4DAF7', width: '60px', textAlign: 'center',
              height: '60px', borderRadius: '50%', position: 'relative', margin: 'auto', top: '40px',
            }}
          >
            {
              <CloseOutlined style={{color: '#508DF8', fontSize: '22px', padding: '4px 0'}} />
            }
            {
              <div style={{color: '#508DF8', fontSize: '18px'}}>
                取消
              </div>
            }
          </div>
          <div style={{
              position: 'absolute', bottom: '10px', textAlign: 'center', width: '100vw', color: '#666'
            }}
          >
            松手发送问题，上滑至按钮取消发送
          </div>
        </div>
      )}
      <Button
        ref={buttonRef}
        className="voiceBtn"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        type={isRecording ? 'primary' : 'default'}
        style={{zIndex: '100', position: 'relative', background: isRecording ? '#446dff' : 'rgba(0,0,0,0)'}}
        block
      >
        {/* {!isRecording && ('请按住说话')} */}
        {isRecording && (
          <Image
              height={40}
              width={140}
              preview={false}
              style={{filter: 'invert(100%)'}}
              src={require('../../assets/icon/recording.gif')}
            />
          )}
      </Button>
        {!isRecording && (<a style={{fontWeight: 'bold', color: '#333', zIndex: 1, userSelect: 'none', width: '130px', top: '12px', position: 'absolute', left: '130px'}}>请按住说话</a>)}
    </div>
  );
};

export default VoiceInput;
