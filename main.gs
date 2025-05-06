// ===概要===
// 二段構えで行きたい
// <第1案>
// getSheetAllDatas()から配列でやる(50000回まで？諸説あり)
// <第2案>
// formから回答を直接取得してやる(？回/日)
// 詳細は下記URL
// https://walking-elephant.blogspot.com/2021/01/gas.formapp.html
// どっちにしろ対応できるよう別関数でバックアップが効くように


const lines = 18;


//HTTP GETハンドリング
function doGet(e) {

  var value;

  try{
    //第一段階
    var [element,result,diff_arr] = getDataFromSheet();
  }catch(e){
    try{
      //第二段階
      var [element,result,diff_arr] = getDataFromForm();
    }catch(e){
      console.log('シート取得関数にエラー・回数オーバーか？：' + e.message);
      value = "ERROR";
    }
  }

  if (value !== "ERROR") { 
    const sortedArraysResult = sortArrays(element, result, diff_arr);

    if (sortedArraysResult && sortedArraysResult.length === 3 &&
        Array.isArray(sortedArraysResult[0]) && // 各要素が配列であることも確認
        Array.isArray(sortedArraysResult[1]) &&
        Array.isArray(sortedArraysResult[2])) {
      value = {
        "element": sortedArraysResult[0],
        "result": sortedArraysResult[1],
        "diff_arr": sortedArraysResult[2] 
      };
    } else {
      console.log('ソート処理でエラー、または期待される配列構造ではありません。');
      value = "ERROR_SORTING";
    }
  }

  var result_json = {
    message: value
  }

  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(result_json));

  return out;
}



//第1案・シートから取得)(50000/日？)
function getDataFromSheet() {
  const sheetId = '＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊';         //ここ変えるよね//
  const sheet = SpreadsheetApp.openById(sheetId);
  const range = sheet.getDataRange();

  //配列形式で入ってる...と思う
  const allDatas = range.getValues();

  var element = [];
  var result = [];
  var diff_arr =[];
  var howManyLoop;

  for(let i=1; i < allDatas.length; i++){
    var div_Data = allDatas[allDatas.length-i];
    var cleer = div_Data.filter(Boolean);
    //element(既出のもの)の情報ではない (かつ) 情報がundefinedではない (かつ) 情報が数字である(諸説あり)
    if((!element.includes(cleer[1])) && !(cleer[2] === void 0) && !(isNaN(cleer[2]))) {
      element.push(cleer[1]);
      result.push(cleer[2]);
      diff_arr.push(timeDiff(cleer[0]));
    }
    if(result.length == lines){
      howManyLoop = i;
      break;
    }
  }

  console.log(element,result,diff_arr,howManyLoop);
  return [element,result,diff_arr];
}

//第2案・formからデータを取得(?/日)
function getDataFromForm() {
  var formId = '＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊'           //ここ変えましょう//
  var form = FormApp.openById(formId)
  var formResponses = form.getResponses()

  var element = [];
  var result = [];
  var diff_arr =[];
  var howManyLoop;

  for(let i=1; i < formResponses.length; i++){
    var itemResponses = formResponses[formResponses.length - i].getItemResponses()
    var cl = itemResponses[0].getResponse()
    var vl = itemResponses[1].getResponse()
    if((!element.includes(cl)) && !(vl === void 0) && !(isNaN(vl))) {
      element.push(cl);
      result.push(parseInt(vl));
      var form_time = formResponses[formResponses.length - i].getTimestamp();
      diff_arr.push(timeDiff(form_time));
    }
    if(result.length == lines){
      howManyLoop = i;
      break;
    }
  }

  console.log(element,result,diff_arr,howManyLoop)
  return [element,result,diff_arr]
}



//時間差取得関数
function timeDiff (timeA){
  // ミリ秒に変換して差を取る
  var time_a = new Date(timeA).getTime();
  var now_date = new Date(); 
  const diff = Math.abs(now_date - time_a);

  // 四捨五入して計算/単位は分
  var diff_minutes = diff / 1000 / 60;
  diff_minutes = Math.round(diff_minutes * 10)/10

  return(diff_minutes);
}


//配列変換
function sortArrays(...arrays) {
  if (!arrays || arrays.length === 0) {
    return [];
  }
  
  const firstArray = arrays[0]; 
  if (!firstArray || !Array.isArray(firstArray) || firstArray.length === 0) {
    return arrays.map(() => []);
  }

  const numElements = firstArray.length;
  const numArrays = arrays.length;

  for (let i = 1; i < numArrays; i++) {
    if (!arrays[i] || !Array.isArray(arrays[i]) || arrays[i].length !== numElements) {
      console.error("ソート対象のすべての配列は同じ長さで、かつ有効な配列である必要があります。");
      return arrays.map(() => []); 
    }
  }

  let combined = [];
  for (let i = 0; i < numElements; i++) {
    const group = [];
    for (let j = 0; j < numArrays; j++) {
      group.push(arrays[j][i]);
    }
    combined.push(group);
  }

  combined.sort((groupA, groupB) => {
    const valA = groupA[0];
    const valB = groupB[0];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB);
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }

    return String(valA).localeCompare(String(valB));
  });

  const resultArrays = [];
  for (let j = 0; j < numArrays; j++) {
    resultArrays.push(combined.map(group => group[j]));
  }

  return resultArrays;
}
