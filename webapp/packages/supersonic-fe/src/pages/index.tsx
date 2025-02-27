import { useEffect, useTransition } from 'react';
import { useLocation } from '@umijs/max';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { ELEPHANT_USERNAME_KEY } from '@/common/constants';

// 默认设置为h5模式
const rootELe = document.getElementById('root')
if (rootELe) {
  rootELe.classList.add('h5-mode')
}
// 直接使用当前页面的 URL
var url = new URL(window.location.href);
// 解析查询参数
const oaAccount = url.searchParams?.get('oaAccount');
if (oaAccount) {
  localStorage.setItem(ELEPHANT_USERNAME_KEY, oaAccount);
}
// 非h5模式去掉class
const mode = url.searchParams?.get('mode');
if (!mode && rootELe) {
  rootELe.classList.remove('h5-mode')
}
console.log('mode', mode, '、oaAccount', oaAccount);

NProgress.configure({ showSpinner: false });

const startProgress = () => {
  NProgress.start();
};

const stopProgress = () => {
  NProgress.done();
};

const Page = ({ dom }) => {
  const [isPending, startTransition] = useTransition();
  const location = useLocation();

  useEffect(() => {
    startTransition(() => {
      startProgress();
    });

    return () => {
      stopProgress();
    };
  }, [location]);

  useEffect(() => {
    if (!isPending) {
      stopProgress();
    }
  }, [isPending]);

  return <>{dom}</>;
};

export default Page;
