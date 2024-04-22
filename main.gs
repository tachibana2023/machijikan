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
    var [element,result] = getDataFromSheet();
  }catch(e){
    try{
      //第二段階
      var [element,result] = getDataFromForm();
    }catch(e){
      console.log('シート取得関数にエラー・回数オーバーか？：' + e.message);
      value = "ERROR";
    }
  }

  if(result){
    let [sortedArrayA, sortedArrayB] = sortArrays(element,result);
    value = {"element":sortedArrayA,"result":sortedArrayB}
  }

  var result = {
    message: value
  }

  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(result));

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

  for(let i=1; i < allDatas.length; i++){
    var div_Data = allDatas[allDatas.length-i];
    var cleer = div_Data;
    //element(既出のもの)の情報ではない (かつ) 情報がundefinedではない (かつ) 情報が数字である(諸説あり)
    if((!element.includes(cleer[1])) && !(cleer[2] === void 0) && !(isNaN(cleer[2]))) {
      element.push(cleer[1]);
      result.push(cleer[2]);
      diff_arr.push(timeDiff(cleer[0]));
    }
    if(result.length == lines){
      var howManyLoop = i;
      break;
    }
  }

  // console.log(element,result,diff_arr,howManyLoop);
  return [element,result];
}

//第2案・formからデータを取得(?/日)
function getDataFromForm() {
  var formId = '＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊'           //ここ変えましょう//
  var form = FormApp.openById(formId)
  var formResponses = form.getResponses()

  var element = [];
  var result = [];

  for(let i=1; i < formResponses.length; i++){
    var itemResponses = formResponses[formResponses.length - i].getItemResponses()
    var cl = itemResponses[0].getResponse()
    var vl = itemResponses[1].getResponse()
    if((!element.includes(cl)) && !(vl === void 0) && !(isNaN(vl))) {
      element.push(cl);
      result.push(vl);
      // diff_arr.push(timeDiff(ttemResponses));
    }
    if(result.length == lines){
      var howManyLoop = i;
      break;
    }

  }

  // console.log(element,result,howManyLoop)
  return [element,result];
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
function sortArrays(arrayA, arrayB) {
    let combinedArray = arrayA.map((value, index) => {
        return {a: value, b: arrayB[index]};
    });

    combinedArray.sort((a, b) => a.a.localeCompare(b.a));

    arrayA = combinedArray.map(obj => obj.a);
    arrayB = combinedArray.map(obj => obj.b);

    return [arrayA, arrayB];
}
