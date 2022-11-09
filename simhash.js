const { createHash } = require('crypto');

const bigInts = require('big-integer');

/**
 * simhash 相似度匹配算法
 * simhash 的主要思想是将高维的特征向量（文本可转换为高维向量表示）映射成低维的特征向量，通过计算两个向量的汉明距离(Hamming Distance)来确定文本的相似度。
 * 其中，汉明距离，表示在两个等长字符串中对应位置不同字符的个数。
 * 在此算法基础上增加最小编辑距离计算，增加小文本的校验准确性
 *
 * 具体步骤：
 *  1、分词
 *  2、hash
 *  3、加权
 *  4、合并
 *  5、降维
 *
 * 工具使用：
    const simHash = new SimHash();
    console.log(simHash.isSame('getRuoteType', 'getTypes')
 *
 */

// 先关闭一下规则
/* eslint-disable no-unused-vars, no-plusplus, prefer-template, eqeqeq, no-param-reassign, prefer-const */
class SimHash {
  HASH_SIZE = 128;

  isSame = (str1, str2) => {
    const hm = this.hammingDistance(this.run(str1), this.run(str2));

    const same = 100 - (hm * 100) / 128;
    const minVal = minDistance(str1, str2);

    // 结果准确性还需要进一步的大量数据计算一个拐点值
    if ((same > 90 && minVal < 4) || minVal < Math.min(str1.length, str2.length) / 5) {
      return true;
    }
    return false;
  };

  token = (s) => {
    // 如许长文本检测 使用jieba 进行自然语言处理分词 目前只针对函数名 直接截取即可
    return s.split('');
  };

  hash = (message) => {
    const md5 = createHash('md5');

    // hex 转化为十六进制
    const digest = md5.update(message, 'utf8').digest('hex');
    const bit = bigInts(digest, 16).toString(2);
    return bit;
  };

  // MD5哈希二进制最高位如果为 0，则不存储，比如 a 计算 hash 后长度为 124 位，需要前置补位
  fillHash = (strToken) => {
    // hash 计算
    let itemHash = this.hash(strToken);

    if (itemHash.length < this.HASH_SIZE) {
      const que = this.HASH_SIZE - itemHash.length;
      for (let j = 0; j < que; j++) {
        itemHash = '0' + itemHash;
      }
    }

    return itemHash;
  };

  weightHash = (itemHash) => {
    const itemHashArr = itemHash.split('');

    // 加权 由于没有进行分词 加权目前全部为 1
    for (let j = 0, len = itemHashArr.length; j < len; j++) {
      if (itemHashArr[j] == '1') {
        itemHashArr[j]++;
      } else {
        itemHashArr[j]--;
      }
    }

    return itemHashArr;
  };

  mergeHash = (itemHashArr, res) => {
    for (let j = 0, len = itemHashArr.length; j < len; j++) {
      itemHashArr[j] += res[j] || 0;
    }

    return itemHashArr;
  };

  binaryStr = (res) => {
    let str = '';
    for (let i = 0, len = res.length; i < len; i++) {
      if (res[i] <= 0) {
        str += '0';
      } else {
        str += '1';
      }
    }

    return str;
  };

  hammingDistance = (bit1, bit2) => {
    const bit1Arr = bit1.split('');
    const bit2Arr = bit2.split('');

    let hm = 0;

    for (let i = 0, len = bit1Arr.length; i < len; i++) {
      if (bit1Arr[i] !== bit2Arr[i]) {
        hm++;
      }
    }

    return hm;
  };

  run = (str) => {
    // const hashList = new Array(128).fill(0);
    const hashList = new Array(this.HASH_SIZE);
    for (let i = 0, len = hashList.length; i < len; i++) {
      hashList[i] = 0;
    }

    // 分词
    const tokenList = this.token(str);

    // 合并值
    let res = [];

    for (let i = 0, len = tokenList.length; i < len; i++) {
      // hash 计算
      let itemHash = this.fillHash(tokenList[i]);

      // 加权
      const itemHashArr = this.weightHash(itemHash);

      // 合并
      const val = this.mergeHash(itemHashArr, res);
      res = val;
    }

    // 降维
    const binaryStr = this.binaryStr(res);

    // 提供此值计算海明距离
    return binaryStr;
  };
}

// 最小编辑距离
function minDistance(str1, str2) {
  let m = str1.length;
  let n = str2.length;

  // 最小编辑距离是dp[i+1][j+1]
  let dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));

  // base case
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
  }

  // 自底向上求解
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // 相同字符跳过
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // 删除 插入 替换 寻找最小操作步骤
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }

  return dp[m][n];
}

/* eslint-enable no-unused-vars, no-plusplus, prefer-template, eqeqeq, no-param-reassign, prefer-const */
