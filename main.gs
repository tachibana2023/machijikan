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
  let rawElement, rawResult, rawDiffArr;

  try {
    //第一段階
    [rawElement, rawResult, rawDiffArr] = getDataFromSheet();
  } catch (error1) {
    console.log('getDataFromSheetでエラー: ' + error1.message);
    try {
      //第二段階
      [rawElement, rawResult, rawDiffArr] = getDataFromForm();
    } catch (error2) {
      console.log('getDataFromFormでもエラー: ' + error2.message);
      value = "ERROR_FETCHING_DATA";
    }
  }

  if (value !== "ERROR_FETCHING_DATA" && rawElement && rawResult && rawDiffArr) {
    const htmlDisplayOrder = [
      "1-A", "1-B", "1-C", "1-D", "1-E", "1-F", "1-G", "1-H", "1-I",
      "2-A", "2-B", "2-C", "2-D", "2-E", "2-F", "2-G", "2-H", "2-I"
    ];

    // 取得したデータをクラス名をキーにしたMapに変換
    const dataMap = new Map();
    for (let i = 0; i < rawElement.length; i++) {
      // 重複するクラス名があった場合、新しいデータで上書き
      dataMap.set(rawElement[i], {
        result: rawResult[i],
        diff: rawDiffArr[i]
      });
    }

    const finalElementArray = [];
    const finalResultArray = [];
    const finalDiffArray = [];

    for (const className of htmlDisplayOrder) {
      finalElementArray.push(className);
      if (dataMap.has(className)) {
        const data = dataMap.get(className);
        finalResultArray.push(data.result);
        finalDiffArray.push(data.diff);
      } else {
        // データが存在しないクラスには空文字を設定
        finalResultArray.push("");
        finalDiffArray.push("");
      }
    }
    
    value = {
      "element": finalElementArray,
      "result": finalResultArray,
      "diff_arr": finalDiffArray
    };

  } else if (!value) {
    console.log('データ取得に成功しましたが、配列が期待通りではありません。');
    value = "ERROR_INVALID_DATA_STRUCTURE";
  }

  var result_json = {
    message: value
  };

  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(result_json));

  console.log(out.getContent())
  return out;
}

//第1案・シートから取得(50000/日？)
function getDataFromSheet() {
  console.log("第1案の実行開始")
  const sheetId = '**********'; //ここ変えるよね//
  const sheet = SpreadsheetApp.openById(sheetId);
  const range = sheet.getDataRange();
  const allDatas = range.getValues(); // [[timestamp, element, result], ...]

  var element = [];
  var result = [];
  var diff_arr = [];
  var uniqueElements = new Set(); // 既に追加したelementを記録

  // 新しいデータから処理するため、配列の後ろからループ
  for (let i = allDatas.length - 1; i >= 1; i--) { // i >= 0 かつヘッダー行をスキップする場合は i >= 1
    if (result.length >= lines) {
      break;
    }
    var div_Data = allDatas[i];
  
    const timestamp = div_Data[0];
    const el = div_Data[1];
    const val = div_Data[2];

    // element(既出のもの)の情報ではない (かつ) resultがundefinedではない (かつ) resultが数字である(または数字に変換可能)
    // 空文字のelも有効なデータとして扱うか要検討。ここでは空文字でないことを前提とする。
    if (el && !uniqueElements.has(el) && val !== undefined && val !== null && !isNaN(parseFloat(String(val).replace(/[^0-9.-]+/g,"")))) {
      element.push(el);
      result.push(parseFloat(String(val).replace(/[^0-9.-]+/g,""))); // 数値に変換して格納
      diff_arr.push(timeDiff(timestamp));
      uniqueElements.add(el);
    }
  }
  
  // console.log(element,result,diff_arr);
  return [element.reverse(), result.reverse(), diff_arr.reverse()];
}

//第2案・formからデータを取得(?/日)
function getDataFromForm() {
  console.log("第2案の実行開始")
  var formId = '**********'; //ここ変えましょう//
  var form = FormApp.openById(formId);
  var formResponses = form.getResponses();

  var element = [];
  var result = [];
  var diff_arr = [];
  var uniqueElements = new Set();

  // 新しい回答から処理
  for (let i = formResponses.length - 1; i >= 0; i--) {
    if (result.length >= lines) {
      break;
    }
    var formResponse = formResponses[i];
    var itemResponses = formResponse.getItemResponses();

    if (itemResponses.length < 2) continue; // 必要な回答項目がない場合はスキップ

    var cl = itemResponses[0].getResponse();
    var vl = itemResponses[1].getResponse();

    if (cl && !uniqueElements.has(cl) && vl !== null && vl !== undefined && !isNaN(parseFloat(String(vl)))) {
      element.push(cl);
      result.push(parseFloat(String(vl))); // 数値として格納
      var form_time = formResponse.getTimestamp();
      diff_arr.push(timeDiff(form_time));
      uniqueElements.add(cl);
    }
  }

  // console.log(element,result,diff_arr);
  return [element, result, diff_arr];
}


//時間差取得関数
function timeDiff (timeA){
  // ミリ秒に変換して差を取る
  var time_a = new Date(timeA).getTime();
  var now_date = new Date().getTime();
  const diff = Math.abs(now_date - time_a);
  var diff_minutes = diff / (1000 * 60);
  diff_minutes = Math.round(diff_minutes * 10) / 10;
  return diff_minutes;
}
