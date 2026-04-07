class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
function $compare_int(a, b) {
  return (a >= b) - (a <= b);
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
function _M0DTPC16result6ResultGuRPB7FailureE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRPB7FailureE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRPB7FailureE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRPB7FailureE2Ok.prototype.$tag = 1;
function _M0DTPC15error5Error41Yoorkin_2fArgParser_2eErrorMsg_2eErrorMsg(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error41Yoorkin_2fArgParser_2eErrorMsg_2eErrorMsg.prototype.$tag = 5;
function _M0DTPC15error5Error63username_2fprisma_2fparser_2eTokenError_2eInvalidCharacterError(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error63username_2fprisma_2fparser_2eTokenError_2eInvalidCharacterError.prototype.$tag = 4;
function _M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError() {}
_M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError.prototype.$tag = 3;
const _M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError__ = new _M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError();
function _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError.prototype.$tag = 2;
function _M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError.prototype.$tag = 1;
function _M0DTPC15error5Error48moonbitlang_2fcore_2fbuiltin_2eFailure_2eFailure(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error48moonbitlang_2fcore_2fbuiltin_2eFailure_2eFailure.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRPB7FailureE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRPB7FailureE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRPB7FailureE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRPB7FailureE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGuRPC15error5ErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRPC15error5ErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRPC15error5ErrorE2Ok.prototype.$tag = 1;
function $bound_check(arr, index) {
  if (index < 0 || index >= arr.length) throw new Error("Index out of bounds");
}
function $makebytes(a, b) {
  const arr = new Uint8Array(a);
  if (b !== 0) {
    arr.fill(b);
  }
  return arr;
}
const _M0MPB7JSArray4push = (arr, val) => { arr.push(val); };
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
function _M0TPB9ArrayViewGRP38username6prisma6parser5PhaseE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGsERPC15error5ErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERPC15error5ErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGsERPC15error5ErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERPC15error5ErrorE2Ok.prototype.$tag = 1;
const $bytes_literal$0 = new Uint8Array();
const _M0MPB7JSArray6splice = (arr, idx, cnt) => arr.splice(idx, cnt);
function _M0TPB9ArrayViewGsE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty() {}
_M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty.prototype.$tag = 0;
const _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty__ = new _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty();
function _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE4Tree(param0, param1, param2, param3, param4) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
  this._3 = param3;
  this._4 = param4;
}
_M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE4Tree.prototype.$tag = 1;
function _M0TPC13ref3RefGbE(param0) {
  this.val = param0;
}
function _M0TPC13ref3RefGsE(param0) {
  this.val = param0;
}
function _M0TP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecE(param0, param1) {
  this.value = param0;
  this.forks = param1;
}
function _M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE2Ok.prototype.$tag = 1;
function _M0DTP27Yoorkin9ArgParser4Spec4Unit(param0) {
  this._0 = param0;
}
_M0DTP27Yoorkin9ArgParser4Spec4Unit.prototype.$tag = 0;
function _M0DTP27Yoorkin9ArgParser4Spec6String(param0) {
  this._0 = param0;
}
_M0DTP27Yoorkin9ArgParser4Spec6String.prototype.$tag = 1;
function _M0DTP27Yoorkin9ArgParser4Spec11Set__string(param0) {
  this._0 = param0;
}
_M0DTP27Yoorkin9ArgParser4Spec11Set__string.prototype.$tag = 2;
function _M0DTP27Yoorkin9ArgParser4Spec3Set(param0) {
  this._0 = param0;
}
_M0DTP27Yoorkin9ArgParser4Spec3Set.prototype.$tag = 3;
function _M0DTP27Yoorkin9ArgParser4Spec5Clear(param0) {
  this._0 = param0;
}
_M0DTP27Yoorkin9ArgParser4Spec5Clear.prototype.$tag = 4;
function _M0TPB9ArrayViewGyE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB9ArrayViewGcE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
const _M0FP311moonbitlang1x2fs15read__file__ffi = function(path) {
   var fs = require('fs');
   try {
     const content = fs.readFileSync(path);
     globalThis.fileContent = content;
     return 0;
   } catch (error) {
     globalThis.errorMessage = error.message;
     return -1;
   }
 };
const _M0FP311moonbitlang1x2fs16write__file__ffi = function(path, content) {
   var fs = require('fs');
   try {
     fs.writeFileSync(path, Buffer.from(content));
     return 0;
   } catch (error) {
     globalThis.errorMessage = error.message;
     return -1;
   }
 };
const _M0FP311moonbitlang1x2fs23get__file__content__ffi = function() {
   return globalThis.fileContent;
 };
const _M0FP311moonbitlang1x2fs24get__error__message__ffi = function() {
   return globalThis.errorMessage || '';
 };
function _M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE2Ok.prototype.$tag = 1;
const _M0FP511moonbitlang1x3sys8internal3ffi24get__cli__args__internal = function() {
  return process.argv.slice(1);
 };
function _M0TPB8MutLocalGsE(param0) {
  this.val = param0;
}
function _M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTP38username6prisma6parser5Token10DATASOURCE() {}
_M0DTP38username6prisma6parser5Token10DATASOURCE.prototype.$tag = 0;
const _M0DTP38username6prisma6parser5Token10DATASOURCE__ = new _M0DTP38username6prisma6parser5Token10DATASOURCE();
function _M0DTP38username6prisma6parser5Token8PROVIDER() {}
_M0DTP38username6prisma6parser5Token8PROVIDER.prototype.$tag = 1;
const _M0DTP38username6prisma6parser5Token8PROVIDER__ = new _M0DTP38username6prisma6parser5Token8PROVIDER();
function _M0DTP38username6prisma6parser5Token3URL() {}
_M0DTP38username6prisma6parser5Token3URL.prototype.$tag = 2;
const _M0DTP38username6prisma6parser5Token3URL__ = new _M0DTP38username6prisma6parser5Token3URL();
function _M0DTP38username6prisma6parser5Token5MODEL() {}
_M0DTP38username6prisma6parser5Token5MODEL.prototype.$tag = 3;
const _M0DTP38username6prisma6parser5Token5MODEL__ = new _M0DTP38username6prisma6parser5Token5MODEL();
function _M0DTP38username6prisma6parser5Token4ENUM() {}
_M0DTP38username6prisma6parser5Token4ENUM.prototype.$tag = 4;
const _M0DTP38username6prisma6parser5Token4ENUM__ = new _M0DTP38username6prisma6parser5Token4ENUM();
function _M0DTP38username6prisma6parser5Token4TYPE() {}
_M0DTP38username6prisma6parser5Token4TYPE.prototype.$tag = 5;
const _M0DTP38username6prisma6parser5Token4TYPE__ = new _M0DTP38username6prisma6parser5Token4TYPE();
function _M0DTP38username6prisma6parser5Token11UNSUPPORTED() {}
_M0DTP38username6prisma6parser5Token11UNSUPPORTED.prototype.$tag = 6;
const _M0DTP38username6prisma6parser5Token11UNSUPPORTED__ = new _M0DTP38username6prisma6parser5Token11UNSUPPORTED();
function _M0DTP38username6prisma6parser5Token6UIDENT(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token6UIDENT.prototype.$tag = 7;
function _M0DTP38username6prisma6parser5Token6LIDENT(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token6LIDENT.prototype.$tag = 8;
function _M0DTP38username6prisma6parser5Token15STRING__LITERAL(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token15STRING__LITERAL.prototype.$tag = 9;
function _M0DTP38username6prisma6parser5Token15NUMBER__LITERAL(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token15NUMBER__LITERAL.prototype.$tag = 10;
function _M0DTP38username6prisma6parser5Token4TRUE() {}
_M0DTP38username6prisma6parser5Token4TRUE.prototype.$tag = 11;
const _M0DTP38username6prisma6parser5Token4TRUE__ = new _M0DTP38username6prisma6parser5Token4TRUE();
function _M0DTP38username6prisma6parser5Token5FALSE() {}
_M0DTP38username6prisma6parser5Token5FALSE.prototype.$tag = 12;
const _M0DTP38username6prisma6parser5Token5FALSE__ = new _M0DTP38username6prisma6parser5Token5FALSE();
function _M0DTP38username6prisma6parser5Token8LBRACKET() {}
_M0DTP38username6prisma6parser5Token8LBRACKET.prototype.$tag = 13;
const _M0DTP38username6prisma6parser5Token8LBRACKET__ = new _M0DTP38username6prisma6parser5Token8LBRACKET();
function _M0DTP38username6prisma6parser5Token8RBRACKET() {}
_M0DTP38username6prisma6parser5Token8RBRACKET.prototype.$tag = 14;
const _M0DTP38username6prisma6parser5Token8RBRACKET__ = new _M0DTP38username6prisma6parser5Token8RBRACKET();
function _M0DTP38username6prisma6parser5Token6LPAREN() {}
_M0DTP38username6prisma6parser5Token6LPAREN.prototype.$tag = 15;
const _M0DTP38username6prisma6parser5Token6LPAREN__ = new _M0DTP38username6prisma6parser5Token6LPAREN();
function _M0DTP38username6prisma6parser5Token6RPAREN() {}
_M0DTP38username6prisma6parser5Token6RPAREN.prototype.$tag = 16;
const _M0DTP38username6prisma6parser5Token6RPAREN__ = new _M0DTP38username6prisma6parser5Token6RPAREN();
function _M0DTP38username6prisma6parser5Token6LBRACE() {}
_M0DTP38username6prisma6parser5Token6LBRACE.prototype.$tag = 17;
const _M0DTP38username6prisma6parser5Token6LBRACE__ = new _M0DTP38username6prisma6parser5Token6LBRACE();
function _M0DTP38username6prisma6parser5Token6RBRACE() {}
_M0DTP38username6prisma6parser5Token6RBRACE.prototype.$tag = 18;
const _M0DTP38username6prisma6parser5Token6RBRACE__ = new _M0DTP38username6prisma6parser5Token6RBRACE();
function _M0DTP38username6prisma6parser5Token8QUESTION() {}
_M0DTP38username6prisma6parser5Token8QUESTION.prototype.$tag = 19;
const _M0DTP38username6prisma6parser5Token8QUESTION__ = new _M0DTP38username6prisma6parser5Token8QUESTION();
function _M0DTP38username6prisma6parser5Token5EQUAL() {}
_M0DTP38username6prisma6parser5Token5EQUAL.prototype.$tag = 20;
const _M0DTP38username6prisma6parser5Token5EQUAL__ = new _M0DTP38username6prisma6parser5Token5EQUAL();
function _M0DTP38username6prisma6parser5Token5COLON() {}
_M0DTP38username6prisma6parser5Token5COLON.prototype.$tag = 21;
const _M0DTP38username6prisma6parser5Token5COLON__ = new _M0DTP38username6prisma6parser5Token5COLON();
function _M0DTP38username6prisma6parser5Token5COMMA() {}
_M0DTP38username6prisma6parser5Token5COMMA.prototype.$tag = 22;
const _M0DTP38username6prisma6parser5Token5COMMA__ = new _M0DTP38username6prisma6parser5Token5COMMA();
function _M0DTP38username6prisma6parser5Token13AT__ATTRIBUTE(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token13AT__ATTRIBUTE.prototype.$tag = 23;
function _M0DTP38username6prisma6parser5Token15ATAT__ATTRIBUTE(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Token15ATAT__ATTRIBUTE.prototype.$tag = 24;
function _M0DTP38username6prisma6parser5Token3EOF() {}
_M0DTP38username6prisma6parser5Token3EOF.prototype.$tag = 25;
const _M0DTP38username6prisma6parser5Token3EOF__ = new _M0DTP38username6prisma6parser5Token3EOF();
function _M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr.prototype.$tag = 0;
function _M0DTP38username6prisma6parser11AttrArgExpr9FieldList(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser11AttrArgExpr9FieldList.prototype.$tag = 1;
function _M0DTP38username6prisma6parser11AttrArgExpr12FunctionCall(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP38username6prisma6parser11AttrArgExpr12FunctionCall.prototype.$tag = 2;
function _M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTP38username6prisma6parser9FieldType10SimpleType(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser9FieldType10SimpleType.prototype.$tag = 0;
function _M0DTP38username6prisma6parser9FieldType8ListType(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser9FieldType8ListType.prototype.$tag = 1;
function _M0DTP38username6prisma6parser9Attribute10SimpleAttr(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser9Attribute10SimpleAttr.prototype.$tag = 0;
function _M0DTP38username6prisma6parser9Attribute12FunctionAttr(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP38username6prisma6parser9Attribute12FunctionAttr.prototype.$tag = 1;
function _M0TP38username6prisma6parser5Field(param0, param1, param2, param3) {
  this.name = param0;
  this.type_ = param1;
  this.required = param2;
  this.attributes = param3;
}
function _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE2Ok.prototype.$tag = 1;
function _M0DTP38username6prisma6parser5Phase10Datasource(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTP38username6prisma6parser5Phase10Datasource.prototype.$tag = 0;
function _M0DTP38username6prisma6parser5Phase5Model(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTP38username6prisma6parser5Phase5Model.prototype.$tag = 1;
function _M0DTP38username6prisma6parser5Phase4Enum(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP38username6prisma6parser5Phase4Enum.prototype.$tag = 2;
function _M0DTP38username6prisma6parser5Phase4Type(param0) {
  this._0 = param0;
}
_M0DTP38username6prisma6parser5Phase4Type.prototype.$tag = 3;
function _M0TP38username6prisma6parser9Tokenizer(param0, param1, param2, param3) {
  this.token_start = param0;
  this.cursor = param1;
  this.src = param2;
  this.cur_token = param3;
}
function _M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGsRPC15error5ErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRPC15error5ErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRPC15error5ErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGOsRPB7FailureE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGOsRPB7FailureE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGOsRPB7FailureE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGOsRPB7FailureE2Ok.prototype.$tag = 1;
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char };
function _M0FP15Error10to__string(_e) {
  switch (_e.$tag) {
    case 1: {
      return _M0IP016_24default__implPB4Show10to__stringGRP311moonbitlang1x2fs7IOErrorE(_e);
    }
    case 5: {
      return "Yoorkin/ArgParser.ErrorMsg.ErrorMsg";
    }
    case 3: {
      return _M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser10TokenErrorE(_e);
    }
    case 0: {
      return _M0IP016_24default__implPB4Show10to__stringGRPB7FailureE(_e);
    }
    case 2: {
      return _M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser10TokenErrorE(_e);
    }
    default: {
      return _M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser10TokenErrorE(_e);
    }
  }
}
const _M0FP38username6prisma6parser7prelude = "import { DatabaseSync, type StatementResultingChanges } from 'node:sqlite'\nimport assert from \"node:assert\";\n\ntype CreateModel<T, KEYS extends string> = Omit<T, KEYS> & {\n  [K in KEYS & keyof T]?: T[K];\n};\n type Criteria<T> = {\n[K in keyof T]:\n | T[K]\n| (null extends T[K] ? Exclude<T[K], null>[] : T[K][])\n | { __raw: true; condition: string };\n};\n\ntype Normal = Record<string, string | number | boolean | null>\n\nexport const makeRawCond = (cond: string) => ({ __raw: true, condition: cond} as const);\n\nconst normalizeValue = (\nvalue: string | number | boolean\n) => typeof value === \"string\" ? `'${value}'` : `${value}`;\n\nconst makeWhere = (\ncriteria: Partial<Criteria<Normal>>\n) => {\nconst kvs = Object.entries(criteria).filter(\n([_, value]) => value !== undefined\n);\n\nconst where = kvs\n.map(([key, value]) => {\nassert(value !== undefined);\nif (value === null) {\nreturn `${key} IS NULL`;\n} else if (typeof value === \"boolean\") {\nreturn `${key} = ${Number(value)}`;\n} else if (typeof value === \"number\" || typeof value === \"string\") {\nreturn `${key} = ${normalizeValue(value)}`;\n} else if (Array.isArray(value)) {\nreturn `${key} IN (${value\n.map((v) => normalizeValue(v)\n\n)\n.join(\", \")})`;\n} else {\nreturn `(${value.condition})`;\n}\n})\n.join(\" AND \");\n\nreturn where === \"\" ? \"\" : \" WHERE \" + where;\n};\n\nconst makeSet = (patch: Normal) => Object.entries(patch) .filter(([_, v]) => v !== undefined) .map(([k, v]) => [k, \"=\", v === null ? \"NULL\" : normalizeValue(v)].join(\" \"));\n\ntype N<T extends string> = T extends `${infer U}[]` ? U : T;\ntype Rel<T extends string> = TypeMap[`${T}Rel` & keyof TypeMap];\ntype Cas<T extends string> = Rel<T> extends infer R extends Record<string, string>\n? {\n[K in keyof R]?: boolean | Cas<N<R[K]>>;\n}\n: never;\n\ntype Index<T, K> = T[K & keyof T];\ntype OmitNever<T> = {\n[K in keyof T as T[K] extends never ? never : K]: T[K]\n};\n\ntype DeepPick<NN extends string, C> = OmitNever<{\n[P in keyof C]: C[P] extends false | undefined\n? never\n: Index<Index<TypeMap, NN>, P> extends infer FieldType extends string\n? N<FieldType> extends infer ModelName extends string\n? Index<\nTypeMap,\n`${ModelName}Base` & keyof TypeMap\n> extends infer BaseType\n? C[P] extends true\n? FieldType extends `${string}[]`\n? BaseType[]\n: BaseType\n: BaseType &\nDeepPick<\n`${N<Index<Index<TypeMap, NN>, P> & string>}Rel`,\nC[P]\n> extends infer R\n? FieldType extends `${string}[]`\n? R[]\n: R\n: never\n: never\n: never\n: never;\n}>;\n\nconst filterKeys = (fields: string[], obj: any) => Object.fromEntries(fields.map(f => [f, obj[f]]).filter(([_, v]) => v !== undefined))\nconst remove = (modelName: string, fields: string[], criteria: Partial<Criteria<Normal>>) => db.prepare(\"DELETE FROM \" + modelName + \" \" + makeWhere(filterKeys(fields, criteria))).run()\n\nconst update = (modelName: string, fields: string[], criteria: Partial<Criteria<Normal>>, patch: Normal) => db .prepare( \"UPDATE \" + modelName + \" SET \" + makeSet(filterKeys(fields, patch)) + makeWhere(filterKeys(fields, criteria))).run();\n";
function _M0FPC15abort5abortGuE(msg) {
  $panic();
}
function _M0FPC15abort5abortGsE(msg) {
  return $panic();
}
function _M0FPC15abort5abortGOiE(msg) {
  return $panic();
}
function _M0FPC15abort5abortGyE(msg) {
  return $panic();
}
function _M0MPB6Logger13write__objectGsE(self, obj) {
  _M0IPC16string6StringPB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRP38username6prisma6parser5PhaseE(self, obj) {
  _M0IP38username6prisma6parser5PhasePB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRPB5ArrayGsEE(self, obj) {
  _M0IPC15array5ArrayPB4Show6outputGsE(obj, self);
}
function _M0MPB6Logger13write__objectGRPB5ArrayGRP38username6prisma6parser5FieldEE(self, obj) {
  _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser5FieldE(obj, self);
}
function _M0MPB6Logger13write__objectGRPB5ArrayGRP38username6prisma6parser9AttributeEE(self, obj) {
  _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser9AttributeE(obj, self);
}
function _M0MPB6Logger13write__objectGiE(self, obj) {
  _M0IPC13int3IntPB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRP38username6prisma6parser5FieldE(self, obj) {
  _M0IP38username6prisma6parser5FieldPB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRP38username6prisma6parser9AttributeE(self, obj) {
  _M0IP38username6prisma6parser9AttributePB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRP38username6prisma6parser9FieldTypeE(self, obj) {
  _M0IP38username6prisma6parser9FieldTypePB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGbE(self, obj) {
  _M0IPC14bool4BoolPB4Show6output(obj, self);
}
function _M0MPB6Logger13write__objectGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEEE(self, obj) {
  _M0IPC15array5ArrayPB4Show6outputGUsRP38username6prisma6parser11AttrArgExprEE(obj, self);
}
function _M0MPB6Logger13write__objectGUsRP38username6prisma6parser11AttrArgExprEE(self, obj) {
  _M0IPC15tuple6Tuple2PB4Show6outputGsRP38username6prisma6parser11AttrArgExprE(obj, self);
}
function _M0MPB6Logger13write__objectGRP38username6prisma6parser11AttrArgExprE(self, obj) {
  _M0IP38username6prisma6parser11AttrArgExprPB4Show6output(obj, self);
}
function _M0IPB7FailurePB4Show6output(_x_4709, _x_4710) {
  const _Failure = _x_4709;
  const _$42$arg_4711 = _Failure._0;
  _x_4710.method_table.method_0(_x_4710.self, "Failure(");
  _M0MPB6Logger13write__objectGsE(_x_4710, _$42$arg_4711);
  _x_4710.method_table.method_0(_x_4710.self, ")");
}
function _M0FPB5abortGuE(string, loc) {
  _M0FPC15abort5abortGuE(`${_M0IPC16string6StringPB4Show10to__string(string)}\n  at ${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)}\n`);
}
function _M0FPB5abortGsE(string, loc) {
  return _M0FPC15abort5abortGsE(`${_M0IPC16string6StringPB4Show10to__string(string)}\n  at ${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)}\n`);
}
function _M0FPB5abortGOiE(string, loc) {
  return _M0FPC15abort5abortGOiE(`${_M0IPC16string6StringPB4Show10to__string(string)}\n  at ${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)}\n`);
}
function _M0FPB5abortGyE(string, loc) {
  return _M0FPC15abort5abortGyE(`${_M0IPC16string6StringPB4Show10to__string(string)}\n  at ${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)}\n`);
}
function _M0MPC14byte4Byte8to__char(self) {
  return self;
}
function _M0MPB13StringBuilder11new_2einner(size_hint) {
  return new _M0TPB13StringBuilder("");
}
function _M0MPB13StringBuilder10to__string(self) {
  return self.val;
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0MPC16uint166UInt1622is__leading__surrogate(self) {
  return _M0IP016_24default__implPB7Compare6op__geGkE(self, 55296) && _M0IP016_24default__implPB7Compare6op__leGkE(self, 56319);
}
function _M0MPC16uint166UInt1623is__trailing__surrogate(self) {
  return _M0IP016_24default__implPB7Compare6op__geGkE(self, 56320) && _M0IP016_24default__implPB7Compare6op__leGkE(self, 57343);
}
function _M0FPB32code__point__of__surrogate__pair(leading, trailing) {
  return (((Math.imul(leading - 55296 | 0, 1024) | 0) + trailing | 0) - 56320 | 0) + 65536 | 0;
}
function _M0MPC16uint166UInt1616unsafe__to__char(self) {
  return self;
}
function _M0MPC16string6String16unsafe__char__at(self, index) {
  const c1 = self.charCodeAt(index);
  if (_M0MPC16uint166UInt1622is__leading__surrogate(c1)) {
    const c2 = self.charCodeAt(index + 1 | 0);
    return _M0FPB32code__point__of__surrogate__pair(c1, c2);
  } else {
    return _M0MPC16uint166UInt1616unsafe__to__char(c1);
  }
}
function _M0IPC14byte4BytePB3Add3add(self, that) {
  return (self + that | 0) & 255;
}
function _M0IPC14byte4BytePB3Div3div(self, that) {
  if (that === 0) {
    $panic();
  }
  return (self / that | 0) & 255;
}
function _M0IPC14byte4BytePB3Mod3mod(self, that) {
  if (that === 0) {
    $panic();
  }
  return (self % that | 0) & 255;
}
function _M0IPC14byte4BytePB3Sub3sub(self, that) {
  return (self - that | 0) & 255;
}
function _M0MPC14byte4Byte7to__hexN14to__hex__digitS3442(i) {
  return i < 10 ? _M0MPC14byte4Byte8to__char(_M0IPC14byte4BytePB3Add3add(i, 48)) : _M0MPC14byte4Byte8to__char(_M0IPC14byte4BytePB3Sub3sub(_M0IPC14byte4BytePB3Add3add(i, 97), 10));
}
function _M0MPC14byte4Byte7to__hex(b) {
  const _self = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPB13StringBuilderPB6Logger11write__char(_self, _M0MPC14byte4Byte7to__hexN14to__hex__digitS3442(_M0IPC14byte4BytePB3Div3div(b, 16)));
  _M0IPB13StringBuilderPB6Logger11write__char(_self, _M0MPC14byte4Byte7to__hexN14to__hex__digitS3442(_M0IPC14byte4BytePB3Mod3mod(b, 16)));
  return _M0MPB13StringBuilder10to__string(_self);
}
function _M0MPC16string10StringView6length(self) {
  return self.end - self.start | 0;
}
function _M0MPC16string10StringView11sub_2einner(self, start, end) {
  const str_len = self.str.length;
  let abs_end;
  if (end === undefined) {
    abs_end = self.end;
  } else {
    const _Some = end;
    const _end = _Some;
    abs_end = _end < 0 ? self.end + _end | 0 : self.start + _end | 0;
  }
  const abs_start = start < 0 ? self.end + start | 0 : self.start + start | 0;
  if (abs_start >= self.start && (abs_start <= abs_end && abs_end <= self.end)) {
    if (abs_start < str_len) {
      if (!_M0MPC16uint166UInt1623is__trailing__surrogate(self.str.charCodeAt(abs_start))) {
      } else {
        $panic();
      }
    }
    if (abs_end < str_len) {
      if (!_M0MPC16uint166UInt1623is__trailing__surrogate(self.str.charCodeAt(abs_end))) {
      } else {
        $panic();
      }
    }
    return new _M0TPC16string10StringView(self.str, abs_start, abs_end);
  } else {
    return $panic();
  }
}
function _M0MPC16string10StringView11unsafe__get(self, index) {
  return self.str.charCodeAt(self.start + index | 0);
}
function _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i) {
  const self = _env._1;
  const logger = _env._0;
  if (i > seg) {
    logger.method_table.method_2(logger.self, _M0MPC16string10StringView11sub_2einner(self, seg, i));
    return;
  } else {
    return;
  }
}
function _M0MPC16string10StringView18escape__to_2einner(self, logger, quote) {
  if (quote) {
    logger.method_table.method_3(logger.self, 34);
  }
  const len = _M0MPC16string10StringView6length(self);
  const _env = { _0: logger, _1: self };
  let _tmp = 0;
  let _tmp$2 = 0;
  _L: while (true) {
    const i = _tmp;
    const seg = _tmp$2;
    if (i >= len) {
      _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
      break;
    }
    const code = _M0MPC16string10StringView11unsafe__get(self, i);
    let c;
    _L$2: {
      switch (code) {
        case 34: {
          c = code;
          break _L$2;
        }
        case 92: {
          c = code;
          break _L$2;
        }
        case 10: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\n");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 13: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\r");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 8: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\b");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 9: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\t");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        default: {
          if (_M0IP016_24default__implPB7Compare6op__ltGkE(code, 32)) {
            _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
            logger.method_table.method_0(logger.self, "\\u{");
            logger.method_table.method_0(logger.self, _M0MPC14byte4Byte7to__hex(code & 255));
            logger.method_table.method_3(logger.self, 125);
            _tmp = i + 1 | 0;
            _tmp$2 = i + 1 | 0;
            continue _L;
          } else {
            _tmp = i + 1 | 0;
            continue _L;
          }
        }
      }
    }
    _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS3427(_env, seg, i);
    logger.method_table.method_3(logger.self, 92);
    logger.method_table.method_3(logger.self, _M0MPC16uint166UInt1616unsafe__to__char(c));
    _tmp = i + 1 | 0;
    _tmp$2 = i + 1 | 0;
    continue;
  }
  if (quote) {
    logger.method_table.method_3(logger.self, 34);
    return;
  } else {
    return;
  }
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0IPC16uint166UInt16PB7Compare7compare(self, that) {
  return $compare_int(self, that);
}
function _M0IPC15tuple6Tuple2PB4Show6outputGsRP38username6prisma6parser11AttrArgExprE(self, logger) {
  const _a = self._0;
  const _b = self._1;
  logger.method_table.method_0(logger.self, "(");
  _M0MPB6Logger13write__objectGsE(logger, _a);
  logger.method_table.method_0(logger.self, ", ");
  _M0MPB6Logger13write__objectGRP38username6prisma6parser11AttrArgExprE(logger, _b);
  logger.method_table.method_0(logger.self, ")");
}
function _M0IPC15tuple6Tuple2PB2Eq5equalGsRP38username6prisma6parser11AttrArgExprE(self, other) {
  return self._0 === other._0 && _M0IP38username6prisma6parser11AttrArgExprPB2Eq5equal(self._1, other._1);
}
function _M0IP016_24default__implPB2Eq10not__equalGRP38username6prisma6parser5TokenE(x, y) {
  return !_M0IP38username6prisma6parser5TokenPB2Eq5equal(x, y);
}
function _M0IP016_24default__implPB7Compare6op__ltGkE(x, y) {
  return _M0IPC16uint166UInt16PB7Compare7compare(x, y) < 0;
}
function _M0IP016_24default__implPB7Compare6op__leGkE(x, y) {
  return _M0IPC16uint166UInt16PB7Compare7compare(x, y) <= 0;
}
function _M0IP016_24default__implPB7Compare6op__geGkE(x, y) {
  return _M0IPC16uint166UInt16PB7Compare7compare(x, y) >= 0;
}
function _M0MPC16string6String11sub_2einner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    const _end = _Some;
    end$2 = _end < 0 ? len + _end | 0 : _end;
  }
  const start$2 = start < 0 ? len + start | 0 : start;
  if (start$2 >= 0 && (start$2 <= end$2 && end$2 <= len)) {
    if (start$2 < len) {
      if (!_M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(start$2))) {
      } else {
        $panic();
      }
    }
    if (end$2 < len) {
      if (!_M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(end$2))) {
      } else {
        $panic();
      }
    }
    return new _M0TPC16string10StringView(self, start$2, end$2);
  } else {
    return $panic();
  }
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String11sub_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show10to__stringGRPC15error5ErrorE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPC15error5ErrorPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRPB5ArrayGRP38username6prisma6parser5PhaseEE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser5PhaseE(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPB9SourceLocPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGiE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPC13int3IntPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IP38username6prisma6parser5TokenPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGOiE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPC16option6OptionPB4Show6outputGiE(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRP311moonbitlang1x2fs7IOErrorE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IP311moonbitlang1x2fs7IOErrorPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRPB7FailureE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IPB7FailurePB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser10TokenErrorE(self) {
  const logger = _M0MPB13StringBuilder11new_2einner(0);
  _M0IP38username6prisma6parser10TokenErrorPB4Show6output(self, { self: logger, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(logger);
}
function _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(self) {
  const _func = self;
  return _func();
}
function _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser5PhaseE(self, iter, prefix, suffix, sep, trailing) {
  self.method_table.method_0(self.self, prefix);
  if (trailing) {
    while (true) {
      const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _x = _Some;
        _M0MPB6Logger13write__objectGRP38username6prisma6parser5PhaseE(self, _x);
        self.method_table.method_0(self.self, sep);
        continue;
      }
    }
  } else {
    const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _x = _Some;
      _M0MPB6Logger13write__objectGRP38username6prisma6parser5PhaseE(self, _x);
      while (true) {
        const _bind$2 = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
        if (_bind$2 === undefined) {
          break;
        } else {
          const _Some$2 = _bind$2;
          const _x$2 = _Some$2;
          self.method_table.method_0(self.self, sep);
          _M0MPB6Logger13write__objectGRP38username6prisma6parser5PhaseE(self, _x$2);
          continue;
        }
      }
    }
  }
  self.method_table.method_0(self.self, suffix);
}
function _M0MPB6Logger19write__iter_2einnerGsE(self, iter, prefix, suffix, sep, trailing) {
  self.method_table.method_0(self.self, prefix);
  if (trailing) {
    while (true) {
      const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _x = _Some;
        _M0MPB6Logger13write__objectGsE(self, _x);
        self.method_table.method_0(self.self, sep);
        continue;
      }
    }
  } else {
    const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _x = _Some;
      _M0MPB6Logger13write__objectGsE(self, _x);
      while (true) {
        const _bind$2 = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
        if (_bind$2 === undefined) {
          break;
        } else {
          const _Some$2 = _bind$2;
          const _x$2 = _Some$2;
          self.method_table.method_0(self.self, sep);
          _M0MPB6Logger13write__objectGsE(self, _x$2);
          continue;
        }
      }
    }
  }
  self.method_table.method_0(self.self, suffix);
}
function _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser5FieldE(self, iter, prefix, suffix, sep, trailing) {
  self.method_table.method_0(self.self, prefix);
  if (trailing) {
    while (true) {
      const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _x = _Some;
        _M0MPB6Logger13write__objectGRP38username6prisma6parser5FieldE(self, _x);
        self.method_table.method_0(self.self, sep);
        continue;
      }
    }
  } else {
    const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _x = _Some;
      _M0MPB6Logger13write__objectGRP38username6prisma6parser5FieldE(self, _x);
      while (true) {
        const _bind$2 = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
        if (_bind$2 === undefined) {
          break;
        } else {
          const _Some$2 = _bind$2;
          const _x$2 = _Some$2;
          self.method_table.method_0(self.self, sep);
          _M0MPB6Logger13write__objectGRP38username6prisma6parser5FieldE(self, _x$2);
          continue;
        }
      }
    }
  }
  self.method_table.method_0(self.self, suffix);
}
function _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser9AttributeE(self, iter, prefix, suffix, sep, trailing) {
  self.method_table.method_0(self.self, prefix);
  if (trailing) {
    while (true) {
      const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _x = _Some;
        _M0MPB6Logger13write__objectGRP38username6prisma6parser9AttributeE(self, _x);
        self.method_table.method_0(self.self, sep);
        continue;
      }
    }
  } else {
    const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _x = _Some;
      _M0MPB6Logger13write__objectGRP38username6prisma6parser9AttributeE(self, _x);
      while (true) {
        const _bind$2 = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
        if (_bind$2 === undefined) {
          break;
        } else {
          const _Some$2 = _bind$2;
          const _x$2 = _Some$2;
          self.method_table.method_0(self.self, sep);
          _M0MPB6Logger13write__objectGRP38username6prisma6parser9AttributeE(self, _x$2);
          continue;
        }
      }
    }
  }
  self.method_table.method_0(self.self, suffix);
}
function _M0MPB6Logger19write__iter_2einnerGUsRP38username6prisma6parser11AttrArgExprEE(self, iter, prefix, suffix, sep, trailing) {
  self.method_table.method_0(self.self, prefix);
  if (trailing) {
    while (true) {
      const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _x = _Some;
        _M0MPB6Logger13write__objectGUsRP38username6prisma6parser11AttrArgExprEE(self, _x);
        self.method_table.method_0(self.self, sep);
        continue;
      }
    }
  } else {
    const _bind = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _x = _Some;
      _M0MPB6Logger13write__objectGUsRP38username6prisma6parser11AttrArgExprEE(self, _x);
      while (true) {
        const _bind$2 = _M0MPB4Iter4nextGRP38username6prisma6parser5PhaseE(iter);
        if (_bind$2 === undefined) {
          break;
        } else {
          const _Some$2 = _bind$2;
          const _x$2 = _Some$2;
          self.method_table.method_0(self.self, sep);
          _M0MPB6Logger13write__objectGUsRP38username6prisma6parser11AttrArgExprEE(self, _x$2);
          continue;
        }
      }
    }
  }
  self.method_table.method_0(self.self, suffix);
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0FPB13debug__stringGiE(t) {
  const buf = _M0MPB13StringBuilder11new_2einner(50);
  _M0IPC13int3IntPB4Show6output(t, { self: buf, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
  return _M0MPB13StringBuilder10to__string(buf);
}
function _M0FPB4failGuE(msg, loc) {
  return new _M0DTPC16result6ResultGuRPB7FailureE3Err(new _M0DTPC15error5Error48moonbitlang_2fcore_2fbuiltin_2eFailure_2eFailure(`${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)} FAILED: ${_M0IPC16string6StringPB4Show10to__string(msg)}`));
}
function _M0FPB4failGsE(msg, loc) {
  return new _M0DTPC16result6ResultGsRPB7FailureE3Err(new _M0DTPC15error5Error48moonbitlang_2fcore_2fbuiltin_2eFailure_2eFailure(`${_M0IP016_24default__implPB4Show10to__stringGRPB9SourceLocE(loc)} FAILED: ${_M0IPC16string6StringPB4Show10to__string(msg)}`));
}
function _M0FPB10assert__eqGiE(a, b, msg, loc) {
  if (a !== b) {
    let fail_msg;
    if (msg === undefined) {
      fail_msg = `\`${_M0IPC16string6StringPB4Show10to__string(_M0FPB13debug__stringGiE(a))} != ${_M0IPC16string6StringPB4Show10to__string(_M0FPB13debug__stringGiE(b))}\``;
    } else {
      const _Some = msg;
      fail_msg = _Some;
    }
    return _M0FPB4failGuE(fail_msg, loc);
  } else {
    return new _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(undefined);
  }
}
function _M0MPB4Iter3newGRP38username6prisma6parser5PhaseE(f) {
  return f;
}
function _M0IPC16string10StringViewPB4Show10to__string(self) {
  return self.str.substring(self.start, self.end);
}
function _M0MPC16string6String12view_2einner(self, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  return start_offset >= 0 && (start_offset <= end_offset$2 && end_offset$2 <= self.length) ? new _M0TPC16string10StringView(self, start_offset, end_offset$2) : _M0FPB5abortGsE("Invalid index for View", "builtin/stringview.mbt:398:5-398:36@moonbitlang/core");
}
function _M0MPC15array9ArrayView6lengthGcE(self) {
  return self.end - self.start | 0;
}
function _M0MPC15array9ArrayView6lengthGRP38username6prisma6parser5PhaseE(self) {
  return self.end - self.start | 0;
}
function _M0MPC15array9ArrayView6lengthGyE(self) {
  return self.end - self.start | 0;
}
function _M0MPC16string6String11from__array(chars) {
  const buf = _M0MPB13StringBuilder11new_2einner(Math.imul(_M0MPC15array9ArrayView6lengthGcE(chars), 4) | 0);
  const _bind = chars.end - chars.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const c = chars.buf[chars.start + _ | 0];
      _M0IPB13StringBuilderPB6Logger11write__char(buf, c);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0MPB13StringBuilder10to__string(buf);
}
function _M0MPC16string6String24char__length__eq_2einner(self, len, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  let _tmp = start_offset;
  let _tmp$2 = 0;
  while (true) {
    const index = _tmp;
    const count = _tmp$2;
    if (index < end_offset$2 && count < len) {
      const c1 = self.charCodeAt(index);
      if (_M0MPC16uint166UInt1622is__leading__surrogate(c1) && (index + 1 | 0) < end_offset$2) {
        const c2 = self.charCodeAt(index + 1 | 0);
        if (_M0MPC16uint166UInt1623is__trailing__surrogate(c2)) {
          _tmp = index + 2 | 0;
          _tmp$2 = count + 1 | 0;
          continue;
        } else {
          _M0FPB5abortGuE("invalid surrogate pair", "builtin/string.mbt:429:9-429:40@moonbitlang/core");
        }
      }
      _tmp = index + 1 | 0;
      _tmp$2 = count + 1 | 0;
      continue;
    } else {
      return count === len && index === end_offset$2;
    }
  }
}
function _M0MPC16string6String31offset__of__nth__char__backward(self, n, start_offset, end_offset) {
  let _tmp = end_offset;
  let _tmp$2 = 0;
  while (true) {
    const utf16_offset = _tmp;
    const char_count = _tmp$2;
    if ((utf16_offset - 1 | 0) >= start_offset && char_count < n) {
      const c = self.charCodeAt(utf16_offset - 1 | 0);
      if (_M0MPC16uint166UInt1623is__trailing__surrogate(c)) {
        _tmp = utf16_offset - 2 | 0;
        _tmp$2 = char_count + 1 | 0;
        continue;
      } else {
        _tmp = utf16_offset - 1 | 0;
        _tmp$2 = char_count + 1 | 0;
        continue;
      }
    } else {
      return char_count < n || utf16_offset < start_offset ? undefined : utf16_offset;
    }
  }
}
function _M0MPC16string6String30offset__of__nth__char__forward(self, n, start_offset, end_offset) {
  if (start_offset >= 0 && start_offset <= end_offset) {
    let _tmp = start_offset;
    let _tmp$2 = 0;
    while (true) {
      const utf16_offset = _tmp;
      const char_count = _tmp$2;
      if (utf16_offset < end_offset && char_count < n) {
        const c = self.charCodeAt(utf16_offset);
        if (_M0MPC16uint166UInt1622is__leading__surrogate(c)) {
          _tmp = utf16_offset + 2 | 0;
          _tmp$2 = char_count + 1 | 0;
          continue;
        } else {
          _tmp = utf16_offset + 1 | 0;
          _tmp$2 = char_count + 1 | 0;
          continue;
        }
      } else {
        return char_count < n || utf16_offset >= end_offset ? undefined : utf16_offset;
      }
    }
  } else {
    return _M0FPB5abortGOiE("Invalid start index", "builtin/string.mbt:329:5-329:33@moonbitlang/core");
  }
}
function _M0MPC16string6String29offset__of__nth__char_2einner(self, i, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  return i >= 0 ? _M0MPC16string6String30offset__of__nth__char__forward(self, i, start_offset, end_offset$2) : _M0MPC16string6String31offset__of__nth__char__backward(self, -i | 0, start_offset, end_offset$2);
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0IPC16string10StringViewPB4Show10to__string(str)}`;
}
function _M0MPC15array5Array4pushGsE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGcE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGyE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0IPC14char4CharPB4Show10to__string(self) {
  return String.fromCodePoint(self);
}
function _M0MPC16string6String9get__char(self, idx) {
  if (idx >= 0 && idx < self.length) {
    const c = self.charCodeAt(idx);
    if (_M0MPC16uint166UInt1622is__leading__surrogate(c)) {
      if ((idx + 1 | 0) < self.length) {
        const next = self.charCodeAt(idx + 1 | 0);
        return _M0MPC16uint166UInt1623is__trailing__surrogate(next) ? _M0FPB32code__point__of__surrogate__pair(c, next) : -1;
      } else {
        return -1;
      }
    } else {
      return _M0MPC16uint166UInt1623is__trailing__surrogate(c) ? -1 : _M0MPC16uint166UInt1616unsafe__to__char(c);
    }
  } else {
    return -1;
  }
}
function _M0IPC16string6StringPB12ToStringView16to__string__view(self) {
  return new _M0TPC16string10StringView(self, 0, self.length);
}
function _M0MPC16string6String17substring_2einner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    end$2 = _Some;
  }
  return start >= 0 && (start <= end$2 && end$2 <= len) ? self.substring(start, end$2) : $panic();
}
function _M0IPC14bool4BoolPB4Show6output(self, logger) {
  if (self) {
    logger.method_table.method_0(logger.self, "true");
    return;
  } else {
    logger.method_table.method_0(logger.self, "false");
    return;
  }
}
function _M0IPC13int3IntPB4Show6output(self, logger) {
  logger.method_table.method_0(logger.self, _M0MPC13int3Int18to__string_2einner(self, 10));
}
function _M0IPC16string6StringPB4Show6output(self, logger) {
  _M0MPC16string10StringView18escape__to_2einner(new _M0TPC16string10StringView(self, 0, self.length), logger, true);
}
function _M0IPC16string6StringPB4Show10to__string(self) {
  return self;
}
function _M0IPC16option6OptionPB4Show6outputGiE(self, logger) {
  if (self === undefined) {
    logger.method_table.method_0(logger.self, "None");
    return;
  } else {
    const _Some = self;
    const _arg = _Some;
    logger.method_table.method_0(logger.self, "Some(");
    _M0MPB6Logger13write__objectGiE(logger, _arg);
    logger.method_table.method_0(logger.self, ")");
    return;
  }
}
function _M0MPC15array9ArrayView4iterGRP38username6prisma6parser5PhaseE(self) {
  const i = new _M0TPB8MutLocalGiE(0);
  return _M0MPB4Iter3newGRP38username6prisma6parser5PhaseE(() => {
    if (i.val < _M0MPC15array9ArrayView6lengthGRP38username6prisma6parser5PhaseE(self)) {
      const elem = self.buf[self.start + i.val | 0];
      i.val = i.val + 1 | 0;
      return elem;
    } else {
      return undefined;
    }
  });
}
function _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self) {
  return _M0MPC15array9ArrayView4iterGRP38username6prisma6parser5PhaseE(new _M0TPB9ArrayViewGRP38username6prisma6parser5PhaseE(self, 0, self.length));
}
function _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser5PhaseE(self, logger) {
  _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser5PhaseE(logger, _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self), "[", "]", ", ", false);
}
function _M0IPC15array5ArrayPB4Show6outputGsE(self, logger) {
  _M0MPB6Logger19write__iter_2einnerGsE(logger, _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self), "[", "]", ", ", false);
}
function _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser5FieldE(self, logger) {
  _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser5FieldE(logger, _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self), "[", "]", ", ", false);
}
function _M0IPC15array5ArrayPB4Show6outputGRP38username6prisma6parser9AttributeE(self, logger) {
  _M0MPB6Logger19write__iter_2einnerGRP38username6prisma6parser9AttributeE(logger, _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self), "[", "]", ", ", false);
}
function _M0IPC15array5ArrayPB4Show6outputGUsRP38username6prisma6parser11AttrArgExprEE(self, logger) {
  _M0MPB6Logger19write__iter_2einnerGUsRP38username6prisma6parser11AttrArgExprEE(logger, _M0MPC15array5Array4iterGRP38username6prisma6parser5PhaseE(self), "[", "]", ", ", false);
}
function _M0MPC15array9ArrayView2atGyE(self, index) {
  if (index >= 0 && index < (self.end - self.start | 0)) {
    const _tmp = self.buf;
    const _tmp$2 = self.start + index | 0;
    $bound_check(_tmp, _tmp$2);
    return _tmp[_tmp$2];
  } else {
    return _M0FPB5abortGyE(`index out of bounds: the len is from 0 to ${_M0IP016_24default__implPB4Show10to__stringGiE(self.end - self.start | 0)} but the index is ${_M0IP016_24default__implPB4Show10to__stringGiE(index)}`, "builtin/arrayview.mbt:138:5-140:6@moonbitlang/core");
  }
}
function _M0MPC16option6Option6unwrapGiE(self) {
  if (self === undefined) {
    return $panic();
  } else {
    const _Some = self;
    return _Some;
  }
}
function _M0MPC16option6Option16unwrap__or__elseGRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(self, default_) {
  if (self === undefined) {
    return default_();
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0MPC16option6Option7map__orGRP38username6prisma6parser9AttributebE(self, default_, f) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _x = _Some;
    return f(_x);
  }
}
function _M0MPC15array5Array3mapGssE(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      arr[i] = f(v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsEHRPB7Failure(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      const _bind$2 = f(v);
      let _tmp$2;
      if (_bind$2.$tag === 1) {
        const _ok = _bind$2;
        _tmp$2 = _ok._0;
      } else {
        return _bind$2;
      }
      arr[i] = _tmp$2;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE2Ok(arr);
}
function _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      arr[i] = f(v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array3mapGURP38username6prisma6parser5FieldsEsE(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      arr[i] = f(v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsEHRPC15error5Error(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      const _bind$2 = f(v);
      let _tmp$2;
      if (_bind$2.$tag === 1) {
        const _ok = _bind$2;
        _tmp$2 = _ok._0;
      } else {
        return _bind$2;
      }
      arr[i] = _tmp$2;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGsERPC15error5ErrorE2Ok(arr);
}
function _M0MPC15array5Array3mapGUssEsE(self, f) {
  const arr = new Array(self.length);
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      arr[i] = f(v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15bytes5Bytes5makei(length, value) {
  if (length <= 0) {
    return $bytes_literal$0;
  }
  const arr = $makebytes(length, value(0));
  let _tmp = 1;
  while (true) {
    const i = _tmp;
    if (i < length) {
      $bound_check(arr, i);
      arr[i] = value(i);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0FPB7printlnGsE(input) {
  console.log(_M0IPC16string6StringPB4Show10to__string(input));
}
function _M0FPB7printlnGOiE(input) {
  console.log(_M0IP016_24default__implPB4Show10to__stringGOiE(input));
}
function _M0FPB7printlnGRP38username6prisma6parser5TokenE(input) {
  console.log(_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(input));
}
function _M0MPC15bytes5Bytes11from__array(arr) {
  return _M0MPC15bytes5Bytes5makei(_M0MPC15array9ArrayView6lengthGyE(arr), (i) => _M0MPC15array9ArrayView2atGyE(arr, i));
}
function _M0IPB9SourceLocPB4Show6output(self, logger) {
  logger.method_table.method_0(logger.self, self);
}
function _M0MPC15array5Array5makeiGUssEE(length, f) {
  if (length <= 0) {
    return [];
  } else {
    const array = new Array(length);
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < length) {
        array[i] = f(i);
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return array;
  }
}
function _M0MPC15array9ArrayView4joinGsE(self, separator) {
  if ((self.end - self.start | 0) === 0) {
    return "";
  } else {
    const _hd = self.buf[self.start];
    const _x_buf = self.buf;
    const _x_start = 1 + self.start | 0;
    const _x_end = self.end;
    const hd = _M0IPC16string6StringPB12ToStringView16to__string__view(_hd);
    const _bind = _x_end - _x_start | 0;
    let size_hint;
    let _tmp = 0;
    let _tmp$2 = _M0MPC16string10StringView6length(hd);
    while (true) {
      const _ = _tmp;
      const size_hint$2 = _tmp$2;
      if (_ < _bind) {
        const s = _x_buf[_x_start + _ | 0];
        _tmp = _ + 1 | 0;
        _tmp$2 = (size_hint$2 + _M0MPC16string10StringView6length(_M0IPC16string6StringPB12ToStringView16to__string__view(s)) | 0) + _M0MPC16string10StringView6length(separator) | 0;
        continue;
      } else {
        size_hint = size_hint$2;
        break;
      }
    }
    const size_hint$2 = size_hint << 1;
    const buf = _M0MPB13StringBuilder11new_2einner(size_hint$2);
    _M0IPB13StringBuilderPB6Logger11write__view(buf, hd);
    if (_M0MPC16string6String24char__length__eq_2einner(separator.str, 0, separator.start, separator.end)) {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = _M0IPC16string6StringPB12ToStringView16to__string__view(s);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    } else {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = _M0IPC16string6StringPB12ToStringView16to__string__view(s);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, separator);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    }
    return _M0MPB13StringBuilder10to__string(buf);
  }
}
function _M0MPC15array5Array6removeGsE(self, index) {
  if (index >= 0 && index < self.length) {
    $bound_check(self, index);
    const value = self[index];
    _M0MPB7JSArray6splice(self, index, 1);
    return value;
  } else {
    return _M0FPB5abortGsE(`index out of bounds: the len is from 0 to ${_M0IP016_24default__implPB4Show10to__stringGiE(self.length)} but the index is ${_M0IP016_24default__implPB4Show10to__stringGiE(index)}`, "builtin/arraycore_js.mbt:251:5-253:6@moonbitlang/core");
  }
}
function _M0MPC15array5Array2atGsE(self, index) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    return self[index];
  } else {
    return $panic();
  }
}
function _M0MPC15array5Array4foldGUssRP27Yoorkin9ArgParser4SpecsEURP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEsEE(self, init, f) {
  const _bind = self.length;
  let _tmp = 0;
  let _tmp$2 = init;
  while (true) {
    const _ = _tmp;
    const acc = _tmp$2;
    if (_ < _bind) {
      const item = self[_];
      _tmp = _ + 1 | 0;
      _tmp$2 = f(acc, item);
      continue;
    } else {
      return acc;
    }
  }
}
function _M0IPC15array5ArrayPB2Eq5equalGUsRP38username6prisma6parser11AttrArgExprEE(self, other) {
  const self_len = self.length;
  const other_len = other.length;
  if (self_len === other_len) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < self_len) {
        if (_M0IPC15tuple6Tuple2PB2Eq5equalGsRP38username6prisma6parser11AttrArgExprE(self[i], other[i])) {
        } else {
          return false;
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return true;
      }
    }
  } else {
    return false;
  }
}
function _M0IPC15array5ArrayPB2Eq5equalGsE(self, other) {
  const self_len = self.length;
  const other_len = other.length;
  if (self_len === other_len) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < self_len) {
        if (self[i] === other[i]) {
        } else {
          return false;
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return true;
      }
    }
  } else {
    return false;
  }
}
function _M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(self, f) {
  const arr = [];
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const v = self[_];
      if (f(v)) {
        _M0MPC15array5Array4pushGsE(arr, v);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array8containsGRP38username6prisma6parser9AttributeE(self, value) {
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const v = self[_];
      if (_M0IP38username6prisma6parser9AttributePB2Eq5equal(v, value)) {
        return true;
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      return false;
    }
  }
}
function _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(self, f) {
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const v = self[i];
      if (f(v)) {
        return i;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldsE(self, f) {
  const result = [];
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const x = self[_];
      const _bind$2 = f(x);
      if (_bind$2 === undefined) {
      } else {
        const _Some = _bind$2;
        const _x = _Some;
        _M0MPC15array5Array4pushGsE(result, _x);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5PhasesE(self, f) {
  const result = [];
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const x = self[_];
      const _bind$2 = f(x);
      if (_bind$2 === undefined) {
      } else {
        const _Some = _bind$2;
        const _x = _Some;
        _M0MPC15array5Array4pushGsE(result, _x);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldsEHRPB7Failure(self, f) {
  const result = [];
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const x = self[_];
      const _bind$2 = f(x);
      let _bind$3;
      if (_bind$2.$tag === 1) {
        const _ok = _bind$2;
        _bind$3 = _ok._0;
      } else {
        return _bind$2;
      }
      if (_bind$3 === undefined) {
      } else {
        const _Some = _bind$3;
        const _x = _Some;
        _M0MPC15array5Array4pushGsE(result, _x);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGsERPB7FailureE2Ok(result);
}
function _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldURP38username6prisma6parser5FieldsEE(self, f) {
  const result = [];
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const x = self[_];
      const _bind$2 = f(x);
      if (_bind$2 === undefined) {
      } else {
        const _Some = _bind$2;
        const _x = _Some;
        _M0MPC15array5Array4pushGsE(result, _x);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0MPC15array5Array3zipGssE(self, other) {
  const length = self.length < other.length ? self.length : other.length;
  return _M0MPC15array5Array5makeiGUssEE(length, (i) => ({ _0: _M0MPC15array5Array2atGsE(self, i), _1: _M0MPC15array5Array2atGsE(other, i) }));
}
function _M0MPC15array5Array4joinGsE(self, separator) {
  return _M0MPC15array9ArrayView4joinGsE(new _M0TPB9ArrayViewGsE(self, 0, self.length), separator);
}
function _M0IPC15error5ErrorPB4Show6output(self, logger) {
  logger.method_table.method_0(logger.self, _M0FP15Error10to__string(self));
}
function _M0MPC25immut11sorted__map9SortedMap3newGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE() {
  return _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty__;
}
function _M0MPC25immut11sorted__map9SortedMap9singletonGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value) {
  return new _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE4Tree(key, value, 1, _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty__, _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE5Empty__);
}
function _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(self) {
  if (self.$tag === 0) {
    return 0;
  } else {
    const _Tree = self;
    return _Tree._2;
  }
}
function _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, r) {
  const size = (_M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(l) + _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(r) | 0) + 1 | 0;
  return new _M0DTPC25immut11sorted__map9SortedMapGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE4Tree(key, value, size, l, r);
}
function _M0MPC25immut11sorted__map9SortedMap3getGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(self, key) {
  let _tmp = self;
  while (true) {
    const _param = _tmp;
    if (_param.$tag === 0) {
      return undefined;
    } else {
      const _Tree = _param;
      const _k = _Tree._0;
      const _value = _Tree._1;
      const _l = _Tree._3;
      const _r = _Tree._4;
      const c = $compare_int(key, _k);
      if (c === 0) {
        return _value;
      } else {
        if (c < 0) {
          _tmp = _l;
          continue;
        } else {
          _tmp = _r;
          continue;
        }
      }
    }
  }
}
function _M0FPC25immut11sorted__map7balanceGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, r) {
  const ln = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(l);
  const rn = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(r);
  if ((ln + rn | 0) < 2) {
    return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, r);
  } else {
    if (rn > (Math.imul(5, ln) | 0)) {
      if (r.$tag === 1) {
        const _Tree = r;
        const _rl = _Tree._3;
        const _rr = _Tree._4;
        const rln = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_rl);
        const rrn = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_rr);
        if (rln < rrn) {
          if (r.$tag === 1) {
            const _Tree$2 = r;
            const _k2 = _Tree$2._0;
            const _v2 = _Tree$2._1;
            const _y = _Tree$2._3;
            const _z = _Tree$2._4;
            return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k2, _v2, _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, _y), _z);
          } else {
            return $panic();
          }
        } else {
          _L: {
            if (r.$tag === 1) {
              const _Tree$2 = r;
              const _k3 = _Tree$2._0;
              const _v3 = _Tree$2._1;
              const _x = _Tree$2._3;
              if (_x.$tag === 1) {
                const _Tree$3 = _x;
                const _k2 = _Tree$3._0;
                const _v2 = _Tree$3._1;
                const _y1 = _Tree$3._3;
                const _y2 = _Tree$3._4;
                const _z = _Tree$2._4;
                return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k2, _v2, _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, _y1), _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k3, _v3, _y2, _z));
              } else {
                break _L;
              }
            } else {
              break _L;
            }
          }
          return $panic();
        }
      } else {
        return $panic();
      }
    } else {
      if (ln > (Math.imul(5, rn) | 0)) {
        if (l.$tag === 1) {
          const _Tree = l;
          const _ll = _Tree._3;
          const _lr = _Tree._4;
          const lln = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_ll);
          const lrn = _M0MPC25immut11sorted__map9SortedMap6lengthGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_lr);
          if (lrn < lln) {
            if (l.$tag === 1) {
              const _Tree$2 = l;
              const _k1 = _Tree$2._0;
              const _v1 = _Tree$2._1;
              const _x = _Tree$2._3;
              const _y = _Tree$2._4;
              return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k1, _v1, _x, _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, _y, r));
            } else {
              return $panic();
            }
          } else {
            _L: {
              if (l.$tag === 1) {
                const _Tree$2 = l;
                const _k1 = _Tree$2._0;
                const _v1 = _Tree$2._1;
                const _x = _Tree$2._3;
                const _x$2 = _Tree$2._4;
                if (_x$2.$tag === 1) {
                  const _Tree$3 = _x$2;
                  const _k2 = _Tree$3._0;
                  const _v2 = _Tree$3._1;
                  const _y1 = _Tree$3._3;
                  const _y2 = _Tree$3._4;
                  return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k2, _v2, _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k1, _v1, _x, _y1), _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, _y2, r));
                } else {
                  break _L;
                }
              } else {
                break _L;
              }
            }
            return $panic();
          }
        } else {
          return $panic();
        }
      } else {
        return _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value, l, r);
      }
    }
  }
}
function _M0MPC25immut11sorted__map9SortedMap3addGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(self, key, value) {
  if (self.$tag === 0) {
    return _M0MPC25immut11sorted__map9SortedMap9singletonGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(key, value);
  } else {
    const _Tree = self;
    const _k = _Tree._0;
    const _v = _Tree._1;
    const _l = _Tree._3;
    const _r = _Tree._4;
    const c = $compare_int(key, _k);
    return c === 0 ? _M0FPC25immut11sorted__map10make__treeGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k, value, _l, _r) : c < 0 ? _M0FPC25immut11sorted__map7balanceGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k, _v, _M0MPC25immut11sorted__map9SortedMap3addGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_l, key, value), _r) : _M0FPC25immut11sorted__map7balanceGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_k, _v, _l, _M0MPC25immut11sorted__map9SortedMap3addGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_r, key, value));
  }
}
function _M0FPC13ref3newGbE(x) {
  return new _M0TPC13ref3RefGbE(x);
}
function _M0FPC13ref3newGsE(x) {
  return new _M0TPC13ref3RefGsE(x);
}
function _M0MP27Yoorkin4trie4Trie6lookupGRP27Yoorkin9ArgParser4SpecE(self, path) {
  let _tmp = { _0: _M0MPC16string6String12view_2einner(path, 0, undefined), _1: self };
  while (true) {
    const _param = _tmp;
    let x;
    let xs;
    let trie;
    _L: {
      let trie$2;
      _L$2: {
        const _x = _param._0;
        if (_M0MPC16string6String24char__length__eq_2einner(_x.str, 0, _x.start, _x.end)) {
          const _trie = _param._1;
          trie$2 = _trie;
          break _L$2;
        } else {
          const _x$2 = _M0MPC16string6String16unsafe__char__at(_x.str, _M0MPC16string6String29offset__of__nth__char_2einner(_x.str, 0, _x.start, _x.end));
          const _tmp$2 = _x.str;
          const _bind = _M0MPC16string6String29offset__of__nth__char_2einner(_x.str, 1, _x.start, _x.end);
          let _tmp$3;
          if (_bind === undefined) {
            _tmp$3 = _x.end;
          } else {
            const _Some = _bind;
            _tmp$3 = _Some;
          }
          const _x$3 = new _M0TPC16string10StringView(_tmp$2, _tmp$3, _x.end);
          const _trie = _param._1;
          x = _x$2;
          xs = _x$3;
          trie = _trie;
          break _L;
        }
      }
      return trie$2.value;
    }
    let subtree;
    _L$2: {
      const _bind = _M0MPC25immut11sorted__map9SortedMap3getGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(trie.forks, x);
      if (_bind === undefined) {
        return undefined;
      } else {
        const _Some = _bind;
        const _subtree = _Some;
        subtree = _subtree;
        break _L$2;
      }
    }
    _tmp = { _0: xs, _1: subtree };
    continue;
  }
}
function _M0MP27Yoorkin4trie4Trie3addGRP27Yoorkin9ArgParser4SpecE(self, path, value) {
  const aux = (xs, trie) => {
    let xs$2;
    let x;
    _L: {
      if (_M0MPC16string6String24char__length__eq_2einner(xs.str, 0, xs.start, xs.end)) {
        return new _M0TP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecE(value, trie.forks);
      } else {
        const _x = _M0MPC16string6String16unsafe__char__at(xs.str, _M0MPC16string6String29offset__of__nth__char_2einner(xs.str, 0, xs.start, xs.end));
        const _tmp = xs.str;
        const _bind = _M0MPC16string6String29offset__of__nth__char_2einner(xs.str, 1, xs.start, xs.end);
        let _tmp$2;
        if (_bind === undefined) {
          _tmp$2 = xs.end;
        } else {
          const _Some = _bind;
          _tmp$2 = _Some;
        }
        const _x$2 = new _M0TPC16string10StringView(_tmp, _tmp$2, xs.end);
        xs$2 = _x$2;
        x = _x;
        break _L;
      }
    }
    const subtree = _M0MPC16option6Option16unwrap__or__elseGRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(_M0MPC25immut11sorted__map9SortedMap3getGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(trie.forks, x), () => new _M0TP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecE(undefined, _M0MPC25immut11sorted__map9SortedMap3newGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE()));
    return new _M0TP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecE(trie.value, _M0MPC25immut11sorted__map9SortedMap3addGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE(trie.forks, x, aux(xs$2, subtree)));
  };
  return aux(_M0MPC16string6String12view_2einner(path, 0, undefined), self);
}
function _M0MP27Yoorkin4trie4Trie5emptyGRP27Yoorkin9ArgParser4SpecE() {
  return new _M0TP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecE(undefined, _M0MPC25immut11sorted__map9SortedMap3newGcRP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEE());
}
function _M0FP27Yoorkin9ArgParser9interpret(trie, xs, fallback) {
  let _tmp = new _M0TPB9ArrayViewGsE(xs, 0, xs.length);
  _L: while (true) {
    const _param = _tmp;
    let xs$2;
    let x;
    _L$2: {
      if ((_param.end - _param.start | 0) === 0) {
        break;
      } else {
        const _x = _param.buf[_param.start];
        const _x$2 = new _M0TPB9ArrayViewGsE(_param.buf, 1 + _param.start | 0, _param.end);
        xs$2 = _x$2;
        x = _x;
        break _L$2;
      }
    }
    let spec;
    _L$3: {
      const _bind = _M0MP27Yoorkin4trie4Trie6lookupGRP27Yoorkin9ArgParser4SpecE(trie, x);
      if (_bind === undefined) {
        const _bind$2 = fallback(x);
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          _ok._0;
        } else {
          return _bind$2;
        }
        _tmp = xs$2;
        continue;
      } else {
        const _Some = _bind;
        const _spec = _Some;
        spec = _spec;
        break _L$3;
      }
    }
    let f;
    _L$4: {
      let r;
      _L$5: {
        let r$2;
        _L$6: {
          _L$7: {
            let r$3;
            let ys;
            let y;
            _L$8: {
              let f$2;
              let ys$2;
              let y$2;
              _L$9: {
                switch (spec.$tag) {
                  case 1: {
                    const _String = spec;
                    const _f = _String._0;
                    if ((xs$2.end - xs$2.start | 0) >= 1) {
                      const _y = xs$2.buf[xs$2.start];
                      const _x = new _M0TPB9ArrayViewGsE(xs$2.buf, 1 + xs$2.start | 0, xs$2.end);
                      f$2 = _f;
                      ys$2 = _x;
                      y$2 = _y;
                      break _L$9;
                    } else {
                      break _L$7;
                    }
                  }
                  case 2: {
                    const _Set_string = spec;
                    const _r = _Set_string._0;
                    if ((xs$2.end - xs$2.start | 0) >= 1) {
                      const _y = xs$2.buf[xs$2.start];
                      const _x = new _M0TPB9ArrayViewGsE(xs$2.buf, 1 + xs$2.start | 0, xs$2.end);
                      r$3 = _r;
                      ys = _x;
                      y = _y;
                      break _L$8;
                    } else {
                      break _L$7;
                    }
                  }
                  case 3: {
                    const _Set = spec;
                    const _r$2 = _Set._0;
                    r$2 = _r$2;
                    break _L$6;
                  }
                  case 4: {
                    const _Clear = spec;
                    const _r$3 = _Clear._0;
                    r = _r$3;
                    break _L$5;
                  }
                  default: {
                    const _Unit = spec;
                    const _f$2 = _Unit._0;
                    f = _f$2;
                    break _L$4;
                  }
                }
              }
              const _bind = f$2(y$2);
              if (_bind.$tag === 1) {
                const _ok = _bind;
                _ok._0;
              } else {
                return _bind;
              }
              _tmp = ys$2;
              continue;
            }
            r$3.val = y;
            _tmp = ys;
            continue;
          }
          return new _M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE3Err(new _M0DTPC15error5Error41Yoorkin_2fArgParser_2eErrorMsg_2eErrorMsg(`missing argument for ${_M0IPC16string6StringPB4Show10to__string(x)}`));
        }
        r$2.val = true;
        _tmp = xs$2;
        continue;
      }
      r.val = false;
      _tmp = xs$2;
      continue;
    }
    const _bind = f();
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _ok._0;
    } else {
      return _bind;
    }
    _tmp = xs$2;
    continue;
  }
  return new _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(undefined);
}
function _M0FP27Yoorkin9ArgParser5parse(speclist, rest, usage_msg, argv) {
  const aux = (acc, it) => {
    let trie;
    let help_msg;
    _L: {
      const _trie = acc._0;
      const _help_msg = acc._1;
      trie = _trie;
      help_msg = _help_msg;
      break _L;
    }
    let spec;
    let a;
    let b;
    let help;
    _L$2: {
      const _a = it._0;
      const _b = it._1;
      const _spec = it._2;
      const _help = it._3;
      spec = _spec;
      a = _a;
      b = _b;
      help = _help;
      break _L$2;
    }
    const trie$2 = _M0MP27Yoorkin4trie4Trie3addGRP27Yoorkin9ArgParser4SpecE(_M0MP27Yoorkin4trie4Trie3addGRP27Yoorkin9ArgParser4SpecE(trie, a, spec), b, spec);
    const help_msg$2 = `${help_msg}  ${_M0IPC16string6StringPB4Show10to__string(a)}\t${_M0IPC16string6StringPB4Show10to__string(b)}\t${help}\n`;
    return { _0: trie$2, _1: help_msg$2 };
  };
  let trie;
  let help_msg;
  _L: {
    const _bind = _M0MPC15array5Array4foldGUssRP27Yoorkin9ArgParser4SpecsEURP27Yoorkin4trie4TrieGRP27Yoorkin9ArgParser4SpecEsEE(speclist, { _0: _M0MP27Yoorkin4trie4Trie5emptyGRP27Yoorkin9ArgParser4SpecE(), _1: `${usage_msg}\n options:\n` }, aux);
    const _trie = _bind._0;
    const _help_msg = _bind._1;
    trie = _trie;
    help_msg = _help_msg;
    break _L;
  }
  const help_spec = new _M0DTP27Yoorkin9ArgParser4Spec4Unit(() => new _M0DTPC16result6ResultGuRP27Yoorkin9ArgParser8ErrorMsgE3Err(new _M0DTPC15error5Error41Yoorkin_2fArgParser_2eErrorMsg_2eErrorMsg(help_msg)));
  const trie$2 = _M0MP27Yoorkin4trie4Trie3addGRP27Yoorkin9ArgParser4SpecE(_M0MP27Yoorkin4trie4Trie3addGRP27Yoorkin9ArgParser4SpecE(trie, "--help", help_spec), "-h", help_spec);
  return _M0FP27Yoorkin9ArgParser9interpret(trie$2, argv, rest);
}
function _M0FP411moonbitlang1x8internal3ffi28mbt__string__to__utf8__bytes(str, is_filename) {
  const res = [];
  const len = str.length;
  const i = new _M0TPB8MutLocalGiE(0);
  while (true) {
    if (i.val < len) {
      const _tmp = i.val;
      $bound_check(str, _tmp);
      const c = new _M0TPB8MutLocalGiE(str.charCodeAt(_tmp));
      if (55296 <= c.val && c.val <= 56319) {
        c.val = c.val - 55296 | 0;
        i.val = i.val + 1 | 0;
        const _tmp$2 = i.val;
        $bound_check(str, _tmp$2);
        const l = str.charCodeAt(_tmp$2) - 56320 | 0;
        c.val = ((c.val << 10) + l | 0) + 65536 | 0;
      }
      if (c.val < 128) {
        _M0MPC15array5Array4pushGyE(res, c.val & 255);
      } else {
        if (c.val < 2048) {
          _M0MPC15array5Array4pushGyE(res, (192 + (c.val >> 6) | 0) & 255);
          _M0MPC15array5Array4pushGyE(res, (128 + (c.val & 63) | 0) & 255);
        } else {
          if (c.val < 65536) {
            _M0MPC15array5Array4pushGyE(res, (224 + (c.val >> 12) | 0) & 255);
            _M0MPC15array5Array4pushGyE(res, (128 + (c.val >> 6 & 63) | 0) & 255);
            _M0MPC15array5Array4pushGyE(res, (128 + (c.val & 63) | 0) & 255);
          } else {
            _M0MPC15array5Array4pushGyE(res, (240 + (c.val >> 18) | 0) & 255);
            _M0MPC15array5Array4pushGyE(res, (128 + (c.val >> 12 & 63) | 0) & 255);
            _M0MPC15array5Array4pushGyE(res, (128 + (c.val >> 6 & 63) | 0) & 255);
            _M0MPC15array5Array4pushGyE(res, (128 + (c.val & 63) | 0) & 255);
          }
        }
      }
      i.val = i.val + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (is_filename) {
    _M0MPC15array5Array4pushGyE(res, 0 & 255);
  }
  return _M0MPC15bytes5Bytes11from__array(new _M0TPB9ArrayViewGyE(res, 0, res.length));
}
function _M0FP411moonbitlang1x8internal3ffi28utf8__bytes__to__mbt__string(bytes) {
  const res = [];
  const len = bytes.length;
  const i = new _M0TPB8MutLocalGiE(0);
  while (true) {
    if (i.val < len) {
      const _tmp = i.val;
      $bound_check(bytes, _tmp);
      const c = new _M0TPB8MutLocalGiE(bytes[_tmp]);
      if (c.val < 128) {
        _M0MPC15array5Array4pushGcE(res, c.val);
        i.val = i.val + 1 | 0;
      } else {
        if (c.val < 224) {
          if ((i.val + 1 | 0) >= len) {
            break;
          }
          const _tmp$2 = (c.val & 31) << 6;
          const _tmp$3 = i.val + 1 | 0;
          $bound_check(bytes, _tmp$3);
          c.val = _tmp$2 | bytes[_tmp$3] & 63;
          _M0MPC15array5Array4pushGcE(res, c.val);
          i.val = i.val + 2 | 0;
        } else {
          if (c.val < 240) {
            if ((i.val + 2 | 0) >= len) {
              break;
            }
            const _tmp$2 = (c.val & 15) << 12;
            const _tmp$3 = i.val + 1 | 0;
            $bound_check(bytes, _tmp$3);
            const _tmp$4 = _tmp$2 | (bytes[_tmp$3] & 63) << 6;
            const _tmp$5 = i.val + 2 | 0;
            $bound_check(bytes, _tmp$5);
            c.val = _tmp$4 | bytes[_tmp$5] & 63;
            _M0MPC15array5Array4pushGcE(res, c.val);
            i.val = i.val + 3 | 0;
          } else {
            if ((i.val + 3 | 0) >= len) {
              break;
            }
            const _tmp$2 = (c.val & 7) << 18;
            const _tmp$3 = i.val + 1 | 0;
            $bound_check(bytes, _tmp$3);
            const _tmp$4 = _tmp$2 | (bytes[_tmp$3] & 63) << 12;
            const _tmp$5 = i.val + 2 | 0;
            $bound_check(bytes, _tmp$5);
            const _tmp$6 = _tmp$4 | (bytes[_tmp$5] & 63) << 6;
            const _tmp$7 = i.val + 3 | 0;
            $bound_check(bytes, _tmp$7);
            c.val = _tmp$6 | bytes[_tmp$7] & 63;
            c.val = c.val - 65536 | 0;
            _M0MPC15array5Array4pushGcE(res, (c.val >> 10) + 55296 | 0);
            _M0MPC15array5Array4pushGcE(res, (c.val & 1023) + 56320 | 0);
            i.val = i.val + 4 | 0;
          }
        }
      }
      continue;
    } else {
      break;
    }
  }
  return _M0MPC16string6String11from__array(new _M0TPB9ArrayViewGcE(res, 0, res.length));
}
function _M0IP311moonbitlang1x2fs7IOErrorPB4Show6output(_x_51, _x_52) {
  let _arg_53;
  _L: {
    const _IOError = _x_51;
    const _$42$arg_53 = _IOError._0;
    _arg_53 = _$42$arg_53;
    break _L;
  }
  _x_52.method_table.method_0(_x_52.self, "IOError(");
  _M0MPB6Logger13write__objectGsE(_x_52, _arg_53);
  _x_52.method_table.method_0(_x_52.self, ")");
}
function _M0FP311moonbitlang1x2fs31read__file__to__bytes__internal(path) {
  const res = _M0FP311moonbitlang1x2fs15read__file__ffi(path);
  if (res === -1) {
    return new _M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE3Err(new _M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError(_M0FP311moonbitlang1x2fs24get__error__message__ffi()));
  }
  return new _M0DTPC16result6ResultGzRP311moonbitlang1x2fs7IOErrorE2Ok(_M0FP311moonbitlang1x2fs23get__file__content__ffi());
}
function _M0FP311moonbitlang1x2fs40read__file__to__string__internal_2einner(path, encoding) {
  if (encoding === "utf8") {
    const _bind = _M0FP311moonbitlang1x2fs31read__file__to__bytes__internal(path);
    let bytes;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      bytes = _ok._0;
    } else {
      return _bind;
    }
    return new _M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE2Ok(_M0FP411moonbitlang1x8internal3ffi28utf8__bytes__to__mbt__string(bytes));
  } else {
    return new _M0DTPC16result6ResultGsRP311moonbitlang1x2fs7IOErrorE3Err(new _M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError(`Unsupported encoding: ${_M0IPC16string6StringPB4Show10to__string(encoding)}, only utf8 is supported for now`));
  }
}
function _M0FP311moonbitlang1x2fs32write__bytes__to__file__internal(path, content) {
  const res = _M0FP311moonbitlang1x2fs16write__file__ffi(path, content);
  if (res === -1) {
    return new _M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE3Err(new _M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError(_M0FP311moonbitlang1x2fs24get__error__message__ffi()));
  } else {
    return new _M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE2Ok(undefined);
  }
}
function _M0FP311moonbitlang1x2fs41write__string__to__file__internal_2einner(path, content, encoding) {
  if (encoding === "utf8") {
    const bytes = _M0FP411moonbitlang1x8internal3ffi28mbt__string__to__utf8__bytes(content, false);
    return _M0FP311moonbitlang1x2fs32write__bytes__to__file__internal(path, bytes);
  } else {
    return new _M0DTPC16result6ResultGuRP311moonbitlang1x2fs7IOErrorE3Err(new _M0DTPC15error5Error40moonbitlang_2fx_2ffs_2eIOError_2eIOError(`Unsupported encoding: ${_M0IPC16string6StringPB4Show10to__string(encoding)}, only utf8 is supported for now`));
  }
}
function _M0FP311moonbitlang1x2fs30read__file__to__string_2einner(path, encoding) {
  return _M0FP311moonbitlang1x2fs40read__file__to__string__internal_2einner(path, encoding);
}
function _M0FP311moonbitlang1x2fs31write__string__to__file_2einner(path, content, encoding) {
  return _M0FP311moonbitlang1x2fs41write__string__to__file__internal_2einner(path, content, encoding);
}
function _M0FP511moonbitlang1x3sys8internal3ffi14get__cli__args() {
  return _M0FP511moonbitlang1x3sys8internal3ffi24get__cli__args__internal();
}
function _M0FP311moonbitlang1x3sys14get__cli__args() {
  return _M0FP511moonbitlang1x3sys8internal3ffi14get__cli__args();
}
function _M0IP38username6prisma6parser9AttributePB4Show6output(_x_361, _x_362) {
  let _arg_364;
  let _arg_365;
  _L: {
    let _arg_363;
    _L$2: {
      if (_x_361.$tag === 0) {
        const _SimpleAttr = _x_361;
        const _$42$arg_363 = _SimpleAttr._0;
        _arg_363 = _$42$arg_363;
        break _L$2;
      } else {
        const _FunctionAttr = _x_361;
        const _$42$arg_364 = _FunctionAttr._0;
        const _$42$arg_365 = _FunctionAttr._1;
        _arg_364 = _$42$arg_364;
        _arg_365 = _$42$arg_365;
        break _L;
      }
    }
    _x_362.method_table.method_0(_x_362.self, "SimpleAttr(");
    _M0MPB6Logger13write__objectGsE(_x_362, _arg_363);
    _x_362.method_table.method_0(_x_362.self, ")");
    return;
  }
  _x_362.method_table.method_0(_x_362.self, "FunctionAttr(");
  _x_362.method_table.method_0(_x_362.self, "name=");
  _M0MPB6Logger13write__objectGsE(_x_362, _arg_364);
  _x_362.method_table.method_0(_x_362.self, ", ");
  _x_362.method_table.method_0(_x_362.self, "args=");
  _M0MPB6Logger13write__objectGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEEE(_x_362, _arg_365);
  _x_362.method_table.method_0(_x_362.self, ")");
}
function _M0IP38username6prisma6parser9AttributePB2Eq5equal(_x_345, _x_346) {
  let _x1_350;
  let _x0_349;
  let _y0_351;
  let _y1_352;
  _L: {
    let _x0_347;
    let _y0_348;
    _L$2: {
      if (_x_345.$tag === 0) {
        const _SimpleAttr = _x_345;
        const _$42$x0_347 = _SimpleAttr._0;
        if (_x_346.$tag === 0) {
          const _SimpleAttr$2 = _x_346;
          const _$42$y0_348 = _SimpleAttr$2._0;
          _x0_347 = _$42$x0_347;
          _y0_348 = _$42$y0_348;
          break _L$2;
        } else {
          return false;
        }
      } else {
        const _FunctionAttr = _x_345;
        const _$42$x0_349 = _FunctionAttr._0;
        const _$42$x1_350 = _FunctionAttr._1;
        if (_x_346.$tag === 1) {
          const _FunctionAttr$2 = _x_346;
          const _$42$y0_351 = _FunctionAttr$2._0;
          const _$42$y1_352 = _FunctionAttr$2._1;
          _x1_350 = _$42$x1_350;
          _x0_349 = _$42$x0_349;
          _y0_351 = _$42$y0_351;
          _y1_352 = _$42$y1_352;
          break _L;
        } else {
          return false;
        }
      }
    }
    return _x0_347 === _y0_348;
  }
  return _x0_349 === _y0_351 && _M0IPC15array5ArrayPB2Eq5equalGUsRP38username6prisma6parser11AttrArgExprEE(_x1_350, _y1_352);
}
function _M0IP38username6prisma6parser5FieldPB4Show6output(_x_341, _x_342) {
  _x_342.method_table.method_0(_x_342.self, "{");
  _x_342.method_table.method_0(_x_342.self, "name: ");
  _M0MPB6Logger13write__objectGsE(_x_342, _x_341.name);
  _x_342.method_table.method_0(_x_342.self, ", ");
  _x_342.method_table.method_0(_x_342.self, "type_: ");
  _M0MPB6Logger13write__objectGRP38username6prisma6parser9FieldTypeE(_x_342, _x_341.type_);
  _x_342.method_table.method_0(_x_342.self, ", ");
  _x_342.method_table.method_0(_x_342.self, "required: ");
  _M0MPB6Logger13write__objectGbE(_x_342, _x_341.required);
  _x_342.method_table.method_0(_x_342.self, ", ");
  _x_342.method_table.method_0(_x_342.self, "attributes: ");
  _M0MPB6Logger13write__objectGRPB5ArrayGRP38username6prisma6parser9AttributeEE(_x_342, _x_341.attributes);
  _x_342.method_table.method_0(_x_342.self, "}");
}
function _M0IP38username6prisma6parser5PhasePB4Show6output(_x_315, _x_316) {
  let _arg_325;
  _L: {
    let _arg_323;
    let _arg_324;
    _L$2: {
      let _arg_321;
      let _arg_320;
      let _arg_322;
      _L$3: {
        let _arg_318;
        let _arg_317;
        let _arg_319;
        _L$4: {
          switch (_x_315.$tag) {
            case 0: {
              const _Datasource = _x_315;
              const _$42$arg_317 = _Datasource._0;
              const _$42$arg_318 = _Datasource._1;
              const _$42$arg_319 = _Datasource._2;
              _arg_318 = _$42$arg_318;
              _arg_317 = _$42$arg_317;
              _arg_319 = _$42$arg_319;
              break _L$4;
            }
            case 1: {
              const _Model = _x_315;
              const _$42$arg_320 = _Model._0;
              const _$42$arg_321 = _Model._1;
              const _$42$arg_322 = _Model._2;
              _arg_321 = _$42$arg_321;
              _arg_320 = _$42$arg_320;
              _arg_322 = _$42$arg_322;
              break _L$3;
            }
            case 2: {
              const _Enum = _x_315;
              const _$42$arg_323 = _Enum._0;
              const _$42$arg_324 = _Enum._1;
              _arg_323 = _$42$arg_323;
              _arg_324 = _$42$arg_324;
              break _L$2;
            }
            default: {
              const _Type = _x_315;
              const _$42$arg_325 = _Type._0;
              _arg_325 = _$42$arg_325;
              break _L;
            }
          }
        }
        _x_316.method_table.method_0(_x_316.self, "Datasource(");
        _x_316.method_table.method_0(_x_316.self, "name=");
        _M0MPB6Logger13write__objectGsE(_x_316, _arg_317);
        _x_316.method_table.method_0(_x_316.self, ", ");
        _x_316.method_table.method_0(_x_316.self, "provider=");
        _M0MPB6Logger13write__objectGsE(_x_316, _arg_318);
        _x_316.method_table.method_0(_x_316.self, ", ");
        _x_316.method_table.method_0(_x_316.self, "url=");
        _M0MPB6Logger13write__objectGsE(_x_316, _arg_319);
        _x_316.method_table.method_0(_x_316.self, ")");
        return;
      }
      _x_316.method_table.method_0(_x_316.self, "Model(");
      _x_316.method_table.method_0(_x_316.self, "name=");
      _M0MPB6Logger13write__objectGsE(_x_316, _arg_320);
      _x_316.method_table.method_0(_x_316.self, ", ");
      _x_316.method_table.method_0(_x_316.self, "fields=");
      _M0MPB6Logger13write__objectGRPB5ArrayGRP38username6prisma6parser5FieldEE(_x_316, _arg_321);
      _x_316.method_table.method_0(_x_316.self, ", ");
      _x_316.method_table.method_0(_x_316.self, "attributes=");
      _M0MPB6Logger13write__objectGRPB5ArrayGRP38username6prisma6parser9AttributeEE(_x_316, _arg_322);
      _x_316.method_table.method_0(_x_316.self, ")");
      return;
    }
    _x_316.method_table.method_0(_x_316.self, "Enum(");
    _x_316.method_table.method_0(_x_316.self, "name=");
    _M0MPB6Logger13write__objectGsE(_x_316, _arg_323);
    _x_316.method_table.method_0(_x_316.self, ", ");
    _x_316.method_table.method_0(_x_316.self, "values=");
    _M0MPB6Logger13write__objectGRPB5ArrayGsEE(_x_316, _arg_324);
    _x_316.method_table.method_0(_x_316.self, ")");
    return;
  }
  _x_316.method_table.method_0(_x_316.self, "Type(");
  _x_316.method_table.method_0(_x_316.self, "name=");
  _M0MPB6Logger13write__objectGsE(_x_316, _arg_325);
  _x_316.method_table.method_0(_x_316.self, ")");
}
function _M0IP38username6prisma6parser5TokenPB4Show6output(_x_299, _x_300) {
  let _arg_306;
  _L: {
    let _arg_305;
    _L$2: {
      let _arg_304;
      _L$3: {
        let _arg_303;
        _L$4: {
          let _arg_302;
          _L$5: {
            let _arg_301;
            _L$6: {
              switch (_x_299.$tag) {
                case 0: {
                  _x_300.method_table.method_0(_x_300.self, "DATASOURCE");
                  return;
                }
                case 1: {
                  _x_300.method_table.method_0(_x_300.self, "PROVIDER");
                  return;
                }
                case 2: {
                  _x_300.method_table.method_0(_x_300.self, "URL");
                  return;
                }
                case 3: {
                  _x_300.method_table.method_0(_x_300.self, "MODEL");
                  return;
                }
                case 4: {
                  _x_300.method_table.method_0(_x_300.self, "ENUM");
                  return;
                }
                case 5: {
                  _x_300.method_table.method_0(_x_300.self, "TYPE");
                  return;
                }
                case 6: {
                  _x_300.method_table.method_0(_x_300.self, "UNSUPPORTED");
                  return;
                }
                case 7: {
                  const _UIDENT = _x_299;
                  const _$42$arg_301 = _UIDENT._0;
                  _arg_301 = _$42$arg_301;
                  break _L$6;
                }
                case 8: {
                  const _LIDENT = _x_299;
                  const _$42$arg_302 = _LIDENT._0;
                  _arg_302 = _$42$arg_302;
                  break _L$5;
                }
                case 9: {
                  const _STRING_LITERAL = _x_299;
                  const _$42$arg_303 = _STRING_LITERAL._0;
                  _arg_303 = _$42$arg_303;
                  break _L$4;
                }
                case 10: {
                  const _NUMBER_LITERAL = _x_299;
                  const _$42$arg_304 = _NUMBER_LITERAL._0;
                  _arg_304 = _$42$arg_304;
                  break _L$3;
                }
                case 11: {
                  _x_300.method_table.method_0(_x_300.self, "TRUE");
                  return;
                }
                case 12: {
                  _x_300.method_table.method_0(_x_300.self, "FALSE");
                  return;
                }
                case 13: {
                  _x_300.method_table.method_0(_x_300.self, "LBRACKET");
                  return;
                }
                case 14: {
                  _x_300.method_table.method_0(_x_300.self, "RBRACKET");
                  return;
                }
                case 15: {
                  _x_300.method_table.method_0(_x_300.self, "LPAREN");
                  return;
                }
                case 16: {
                  _x_300.method_table.method_0(_x_300.self, "RPAREN");
                  return;
                }
                case 17: {
                  _x_300.method_table.method_0(_x_300.self, "LBRACE");
                  return;
                }
                case 18: {
                  _x_300.method_table.method_0(_x_300.self, "RBRACE");
                  return;
                }
                case 19: {
                  _x_300.method_table.method_0(_x_300.self, "QUESTION");
                  return;
                }
                case 20: {
                  _x_300.method_table.method_0(_x_300.self, "EQUAL");
                  return;
                }
                case 21: {
                  _x_300.method_table.method_0(_x_300.self, "COLON");
                  return;
                }
                case 22: {
                  _x_300.method_table.method_0(_x_300.self, "COMMA");
                  return;
                }
                case 23: {
                  const _AT_ATTRIBUTE = _x_299;
                  const _$42$arg_305 = _AT_ATTRIBUTE._0;
                  _arg_305 = _$42$arg_305;
                  break _L$2;
                }
                case 24: {
                  const _ATAT_ATTRIBUTE = _x_299;
                  const _$42$arg_306 = _ATAT_ATTRIBUTE._0;
                  _arg_306 = _$42$arg_306;
                  break _L;
                }
                default: {
                  _x_300.method_table.method_0(_x_300.self, "EOF");
                  return;
                }
              }
            }
            _x_300.method_table.method_0(_x_300.self, "UIDENT(");
            _M0MPB6Logger13write__objectGsE(_x_300, _arg_301);
            _x_300.method_table.method_0(_x_300.self, ")");
            return;
          }
          _x_300.method_table.method_0(_x_300.self, "LIDENT(");
          _M0MPB6Logger13write__objectGsE(_x_300, _arg_302);
          _x_300.method_table.method_0(_x_300.self, ")");
          return;
        }
        _x_300.method_table.method_0(_x_300.self, "STRING_LITERAL(");
        _M0MPB6Logger13write__objectGsE(_x_300, _arg_303);
        _x_300.method_table.method_0(_x_300.self, ")");
        return;
      }
      _x_300.method_table.method_0(_x_300.self, "NUMBER_LITERAL(");
      _M0MPB6Logger13write__objectGsE(_x_300, _arg_304);
      _x_300.method_table.method_0(_x_300.self, ")");
      return;
    }
    _x_300.method_table.method_0(_x_300.self, "AT_ATTRIBUTE(");
    _M0MPB6Logger13write__objectGsE(_x_300, _arg_305);
    _x_300.method_table.method_0(_x_300.self, ")");
    return;
  }
  _x_300.method_table.method_0(_x_300.self, "ATAT_ATTRIBUTE(");
  _M0MPB6Logger13write__objectGsE(_x_300, _arg_306);
  _x_300.method_table.method_0(_x_300.self, ")");
}
function _M0IP38username6prisma6parser5TokenPB2Eq5equal(_x_271, _x_272) {
  let _x0_283;
  let _y0_284;
  _L: {
    let _x0_281;
    let _y0_282;
    _L$2: {
      let _x0_279;
      let _y0_280;
      _L$3: {
        let _x0_277;
        let _y0_278;
        _L$4: {
          let _x0_275;
          let _y0_276;
          _L$5: {
            let _x0_273;
            let _y0_274;
            _L$6: {
              switch (_x_271.$tag) {
                case 0: {
                  if (_x_272.$tag === 0) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 1: {
                  if (_x_272.$tag === 1) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 2: {
                  if (_x_272.$tag === 2) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 3: {
                  if (_x_272.$tag === 3) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 4: {
                  if (_x_272.$tag === 4) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 5: {
                  if (_x_272.$tag === 5) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 6: {
                  if (_x_272.$tag === 6) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 7: {
                  const _UIDENT = _x_271;
                  const _$42$x0_273 = _UIDENT._0;
                  if (_x_272.$tag === 7) {
                    const _UIDENT$2 = _x_272;
                    const _$42$y0_274 = _UIDENT$2._0;
                    _x0_273 = _$42$x0_273;
                    _y0_274 = _$42$y0_274;
                    break _L$6;
                  } else {
                    return false;
                  }
                }
                case 8: {
                  const _LIDENT = _x_271;
                  const _$42$x0_275 = _LIDENT._0;
                  if (_x_272.$tag === 8) {
                    const _LIDENT$2 = _x_272;
                    const _$42$y0_276 = _LIDENT$2._0;
                    _x0_275 = _$42$x0_275;
                    _y0_276 = _$42$y0_276;
                    break _L$5;
                  } else {
                    return false;
                  }
                }
                case 9: {
                  const _STRING_LITERAL = _x_271;
                  const _$42$x0_277 = _STRING_LITERAL._0;
                  if (_x_272.$tag === 9) {
                    const _STRING_LITERAL$2 = _x_272;
                    const _$42$y0_278 = _STRING_LITERAL$2._0;
                    _x0_277 = _$42$x0_277;
                    _y0_278 = _$42$y0_278;
                    break _L$4;
                  } else {
                    return false;
                  }
                }
                case 10: {
                  const _NUMBER_LITERAL = _x_271;
                  const _$42$x0_279 = _NUMBER_LITERAL._0;
                  if (_x_272.$tag === 10) {
                    const _NUMBER_LITERAL$2 = _x_272;
                    const _$42$y0_280 = _NUMBER_LITERAL$2._0;
                    _x0_279 = _$42$x0_279;
                    _y0_280 = _$42$y0_280;
                    break _L$3;
                  } else {
                    return false;
                  }
                }
                case 11: {
                  if (_x_272.$tag === 11) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 12: {
                  if (_x_272.$tag === 12) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 13: {
                  if (_x_272.$tag === 13) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 14: {
                  if (_x_272.$tag === 14) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 15: {
                  if (_x_272.$tag === 15) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 16: {
                  if (_x_272.$tag === 16) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 17: {
                  if (_x_272.$tag === 17) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 18: {
                  if (_x_272.$tag === 18) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 19: {
                  if (_x_272.$tag === 19) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 20: {
                  if (_x_272.$tag === 20) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 21: {
                  if (_x_272.$tag === 21) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 22: {
                  if (_x_272.$tag === 22) {
                    return true;
                  } else {
                    return false;
                  }
                }
                case 23: {
                  const _AT_ATTRIBUTE = _x_271;
                  const _$42$x0_281 = _AT_ATTRIBUTE._0;
                  if (_x_272.$tag === 23) {
                    const _AT_ATTRIBUTE$2 = _x_272;
                    const _$42$y0_282 = _AT_ATTRIBUTE$2._0;
                    _x0_281 = _$42$x0_281;
                    _y0_282 = _$42$y0_282;
                    break _L$2;
                  } else {
                    return false;
                  }
                }
                case 24: {
                  const _ATAT_ATTRIBUTE = _x_271;
                  const _$42$x0_283 = _ATAT_ATTRIBUTE._0;
                  if (_x_272.$tag === 24) {
                    const _ATAT_ATTRIBUTE$2 = _x_272;
                    const _$42$y0_284 = _ATAT_ATTRIBUTE$2._0;
                    _x0_283 = _$42$x0_283;
                    _y0_284 = _$42$y0_284;
                    break _L;
                  } else {
                    return false;
                  }
                }
                default: {
                  if (_x_272.$tag === 25) {
                    return true;
                  } else {
                    return false;
                  }
                }
              }
            }
            return _x0_273 === _y0_274;
          }
          return _x0_275 === _y0_276;
        }
        return _x0_277 === _y0_278;
      }
      return _x0_279 === _y0_280;
    }
    return _x0_281 === _y0_282;
  }
  return _x0_283 === _y0_284;
}
function _M0IP38username6prisma6parser9FieldTypePB4Show6output(_x_263, _x_264) {
  let _arg_266;
  _L: {
    let _arg_265;
    _L$2: {
      if (_x_263.$tag === 0) {
        const _SimpleType = _x_263;
        const _$42$arg_265 = _SimpleType._0;
        _arg_265 = _$42$arg_265;
        break _L$2;
      } else {
        const _ListType = _x_263;
        const _$42$arg_266 = _ListType._0;
        _arg_266 = _$42$arg_266;
        break _L;
      }
    }
    _x_264.method_table.method_0(_x_264.self, "SimpleType(");
    _M0MPB6Logger13write__objectGsE(_x_264, _arg_265);
    _x_264.method_table.method_0(_x_264.self, ")");
    return;
  }
  _x_264.method_table.method_0(_x_264.self, "ListType(");
  _M0MPB6Logger13write__objectGsE(_x_264, _arg_266);
  _x_264.method_table.method_0(_x_264.self, ")");
}
function _M0IP38username6prisma6parser9FieldTypePB2Eq5equal(_x_251, _x_252) {
  let _x0_255;
  let _y0_256;
  _L: {
    let _x0_253;
    let _y0_254;
    _L$2: {
      if (_x_251.$tag === 0) {
        const _SimpleType = _x_251;
        const _$42$x0_253 = _SimpleType._0;
        if (_x_252.$tag === 0) {
          const _SimpleType$2 = _x_252;
          const _$42$y0_254 = _SimpleType$2._0;
          _x0_253 = _$42$x0_253;
          _y0_254 = _$42$y0_254;
          break _L$2;
        } else {
          return false;
        }
      } else {
        const _ListType = _x_251;
        const _$42$x0_255 = _ListType._0;
        if (_x_252.$tag === 1) {
          const _ListType$2 = _x_252;
          const _$42$y0_256 = _ListType$2._0;
          _x0_255 = _$42$x0_255;
          _y0_256 = _$42$y0_256;
          break _L;
        } else {
          return false;
        }
      }
    }
    return _x0_253 === _y0_254;
  }
  return _x0_255 === _y0_256;
}
function _M0IP38username6prisma6parser10TokenErrorPB4Show6output(_x_243, _x_244) {
  let _arg_246;
  _L: {
    let _arg_245;
    _L$2: {
      switch (_x_243.$tag) {
        case 4: {
          const _InvalidCharacterError = _x_243;
          const _$42$arg_245 = _InvalidCharacterError._0;
          _arg_245 = _$42$arg_245;
          break _L$2;
        }
        case 3: {
          _x_244.method_table.method_0(_x_244.self, "UnexpectedEofError");
          return;
        }
        default: {
          const _UnexpectedTokenError = _x_243;
          const _$42$arg_246 = _UnexpectedTokenError._0;
          _arg_246 = _$42$arg_246;
          break _L;
        }
      }
    }
    _x_244.method_table.method_0(_x_244.self, "InvalidCharacterError(");
    _M0MPB6Logger13write__objectGsE(_x_244, _arg_245);
    _x_244.method_table.method_0(_x_244.self, ")");
    return;
  }
  _x_244.method_table.method_0(_x_244.self, "UnexpectedTokenError(");
  _M0MPB6Logger13write__objectGsE(_x_244, _arg_246);
  _x_244.method_table.method_0(_x_244.self, ")");
}
function _M0IP38username6prisma6parser11AttrArgExprPB4Show6output(_x_231, _x_232) {
  let _arg_235;
  let _arg_236;
  _L: {
    let _arg_234;
    _L$2: {
      let _arg_233;
      _L$3: {
        switch (_x_231.$tag) {
          case 0: {
            const _SimpleExpr = _x_231;
            const _$42$arg_233 = _SimpleExpr._0;
            _arg_233 = _$42$arg_233;
            break _L$3;
          }
          case 1: {
            const _FieldList = _x_231;
            const _$42$arg_234 = _FieldList._0;
            _arg_234 = _$42$arg_234;
            break _L$2;
          }
          default: {
            const _FunctionCall = _x_231;
            const _$42$arg_235 = _FunctionCall._0;
            const _$42$arg_236 = _FunctionCall._1;
            _arg_235 = _$42$arg_235;
            _arg_236 = _$42$arg_236;
            break _L;
          }
        }
      }
      _x_232.method_table.method_0(_x_232.self, "SimpleExpr(");
      _M0MPB6Logger13write__objectGsE(_x_232, _arg_233);
      _x_232.method_table.method_0(_x_232.self, ")");
      return;
    }
    _x_232.method_table.method_0(_x_232.self, "FieldList(");
    _M0MPB6Logger13write__objectGRPB5ArrayGsEE(_x_232, _arg_234);
    _x_232.method_table.method_0(_x_232.self, ")");
    return;
  }
  _x_232.method_table.method_0(_x_232.self, "FunctionCall(");
  _x_232.method_table.method_0(_x_232.self, "name=");
  _M0MPB6Logger13write__objectGsE(_x_232, _arg_235);
  _x_232.method_table.method_0(_x_232.self, ", ");
  _x_232.method_table.method_0(_x_232.self, "args=");
  _M0MPB6Logger13write__objectGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEEE(_x_232, _arg_236);
  _x_232.method_table.method_0(_x_232.self, ")");
}
function _M0IP38username6prisma6parser11AttrArgExprPB2Eq5equal(_x_211, _x_212) {
  let _x1_218;
  let _x0_217;
  let _y0_219;
  let _y1_220;
  _L: {
    let _x0_215;
    let _y0_216;
    _L$2: {
      let _x0_213;
      let _y0_214;
      _L$3: {
        switch (_x_211.$tag) {
          case 0: {
            const _SimpleExpr = _x_211;
            const _$42$x0_213 = _SimpleExpr._0;
            if (_x_212.$tag === 0) {
              const _SimpleExpr$2 = _x_212;
              const _$42$y0_214 = _SimpleExpr$2._0;
              _x0_213 = _$42$x0_213;
              _y0_214 = _$42$y0_214;
              break _L$3;
            } else {
              return false;
            }
          }
          case 1: {
            const _FieldList = _x_211;
            const _$42$x0_215 = _FieldList._0;
            if (_x_212.$tag === 1) {
              const _FieldList$2 = _x_212;
              const _$42$y0_216 = _FieldList$2._0;
              _x0_215 = _$42$x0_215;
              _y0_216 = _$42$y0_216;
              break _L$2;
            } else {
              return false;
            }
          }
          default: {
            const _FunctionCall = _x_211;
            const _$42$x0_217 = _FunctionCall._0;
            const _$42$x1_218 = _FunctionCall._1;
            if (_x_212.$tag === 2) {
              const _FunctionCall$2 = _x_212;
              const _$42$y0_219 = _FunctionCall$2._0;
              const _$42$y1_220 = _FunctionCall$2._1;
              _x1_218 = _$42$x1_218;
              _x0_217 = _$42$x0_217;
              _y0_219 = _$42$y0_219;
              _y1_220 = _$42$y1_220;
              break _L;
            } else {
              return false;
            }
          }
        }
      }
      return _x0_213 === _y0_214;
    }
    return _M0IPC15array5ArrayPB2Eq5equalGsE(_x0_215, _y0_216);
  }
  return _x0_217 === _y0_219 && _M0IPC15array5ArrayPB2Eq5equalGUsRP38username6prisma6parser11AttrArgExprEE(_x1_218, _y1_220);
}
function _M0MP38username6prisma6parser9Attribute9get__name(self) {
  if (self.$tag === 0) {
    const _SimpleAttr = self;
    const _name = _SimpleAttr._0;
    return _name;
  } else {
    const _FunctionAttr = self;
    const _name = _FunctionAttr._0;
    return _name;
  }
}
function _M0MP38username6prisma6parser9Tokenizer10peek__char(self) {
  return _M0MPC16string6String9get__char(self.src, self.cursor);
}
function _M0MP38username6prisma6parser9Tokenizer10next__char(self) {
  const c = _M0MP38username6prisma6parser9Tokenizer10peek__char(self);
  if (c === -1) {
  } else {
    self.cursor = self.cursor + 1 | 0;
  }
  return c;
}
function _M0MP38username6prisma6parser9Tokenizer6lexeme(self) {
  return _M0MPC16string6String17substring_2einner(self.src, self.token_start, self.cursor);
}
function _M0MP38username6prisma6parser9Tokenizer11next__ident(self) {
  let _tmp = self;
  while (true) {
    const self$2 = _tmp;
    let c;
    _L: {
      const _bind = _M0MP38username6prisma6parser9Tokenizer10peek__char(self$2);
      if (_bind === -1) {
        return _M0MP38username6prisma6parser9Tokenizer6lexeme(self$2);
      } else {
        const _Some = _bind;
        const _c = _Some;
        c = _c;
        break _L;
      }
    }
    if (97 <= c && c <= 122 || (65 <= c && c <= 90 || (48 <= c && c <= 57 || c === 95))) {
      self$2.cursor = self$2.cursor + 1 | 0;
      continue;
    } else {
      return _M0MP38username6prisma6parser9Tokenizer6lexeme(self$2);
    }
  }
}
function _M0MP38username6prisma6parser9Tokenizer21next__number__literal(self) {
  const pass_digit = (t) => {
    let _tmp = t;
    while (true) {
      const t$2 = _tmp;
      let c;
      _L: {
        const _bind = _M0MP38username6prisma6parser9Tokenizer10peek__char(t$2);
        if (_bind === -1) {
          return;
        } else {
          const _Some = _bind;
          const _c = _Some;
          c = _c;
          break _L;
        }
      }
      if (48 <= c && c <= 57) {
        _M0MP38username6prisma6parser9Tokenizer10next__char(t$2);
        continue;
      } else {
        return;
      }
    }
  };
  pass_digit(self);
  let c;
  _L: {
    _L$2: {
      const _bind = _M0MP38username6prisma6parser9Tokenizer10peek__char(self);
      if (_bind === -1) {
      } else {
        const _Some = _bind;
        const _c = _Some;
        c = _c;
        break _L$2;
      }
      break _L;
    }
    if (c === 46) {
      _M0MP38username6prisma6parser9Tokenizer10next__char(self);
      pass_digit(self);
    }
  }
  return _M0MP38username6prisma6parser9Tokenizer6lexeme(self);
}
function _M0MP38username6prisma6parser9Tokenizer21next__string__literal(self) {
  const result = new _M0TPB8MutLocalGsE("");
  while (true) {
    let c;
    _L: {
      _L$2: {
        const _bind = _M0MP38username6prisma6parser9Tokenizer10next__char(self);
        if (_bind === -1) {
          return new _M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE3Err(_M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError__);
        } else {
          const _Some = _bind;
          const _x = _Some;
          switch (_x) {
            case 34: {
              return new _M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE2Ok(result.val);
            }
            case 92: {
              let c$2;
              _L$3: {
                const _bind$2 = _M0MP38username6prisma6parser9Tokenizer10next__char(self);
                if (_bind$2 === -1) {
                  return new _M0DTPC16result6ResultGsRP38username6prisma6parser10TokenErrorE3Err(_M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError__);
                } else {
                  const _Some$2 = _bind$2;
                  const _c = _Some$2;
                  c$2 = _c;
                  break _L$3;
                }
              }
              result.val = `${result.val}${_M0IPC14char4CharPB4Show10to__string(c$2)}`;
              break;
            }
            default: {
              c = _x;
              break _L$2;
            }
          }
        }
        break _L;
      }
      result.val = `${result.val}${_M0IPC14char4CharPB4Show10to__string(c)}`;
    }
    continue;
  }
}
function _M0MP38username6prisma6parser9Tokenizer8do__next(self) {
  let _tmp = self;
  _L: while (true) {
    const self$2 = _tmp;
    self$2.token_start = self$2.cursor;
    let c;
    const _bind = _M0MP38username6prisma6parser9Tokenizer10next__char(self$2);
    if (_bind === -1) {
      return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token3EOF__);
    } else {
      const _Some = _bind;
      const _c = _Some;
      c = _c;
    }
    _L$2: {
      _L$3: {
        switch (c) {
          case 32: {
            break _L$3;
          }
          case 10: {
            break _L$3;
          }
          case 9: {
            break _L$3;
          }
          case 123: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token6LBRACE__);
          }
          case 125: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token6RBRACE__);
          }
          case 40: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token6LPAREN__);
          }
          case 41: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token6RPAREN__);
          }
          case 91: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token8LBRACKET__);
          }
          case 93: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token8RBRACKET__);
          }
          case 63: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token8QUESTION__);
          }
          case 61: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token5EQUAL__);
          }
          case 58: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token5COLON__);
          }
          case 44: {
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token5COMMA__);
          }
        }
        break _L$2;
      }
      continue;
    }
    if (c === 64) {
      let c$2;
      _L$3: {
        const _bind$2 = _M0MP38username6prisma6parser9Tokenizer10next__char(self$2);
        if (_bind$2 === -1) {
          return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE3Err(_M0DTPC15error5Error60username_2fprisma_2fparser_2eTokenError_2eUnexpectedEofError__);
        } else {
          const _Some = _bind$2;
          const _c = _Some;
          c$2 = _c;
          break _L$3;
        }
      }
      if (c$2 === 64) {
        _M0MP38username6prisma6parser9Tokenizer10next__char(self$2);
        return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token15ATAT__ATTRIBUTE(_M0MP38username6prisma6parser9Tokenizer11next__ident(self$2)));
      } else {
        if (c$2 >= 97 && c$2 <= 122) {
          return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token13AT__ATTRIBUTE(_M0MP38username6prisma6parser9Tokenizer11next__ident(self$2)));
        } else {
          return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error63username_2fprisma_2fparser_2eTokenError_2eInvalidCharacterError(`invalid character ${_M0IPC14char4CharPB4Show10to__string(c$2)}`));
        }
      }
    } else {
      if (97 <= c && c <= 122 || c === 95) {
        let id;
        _L$3: {
          const _bind$2 = _M0MP38username6prisma6parser9Tokenizer11next__ident(self$2);
          switch (_bind$2) {
            case "datasource": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token10DATASOURCE__);
            }
            case "provider": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token8PROVIDER__);
            }
            case "url": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token3URL__);
            }
            case "model": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token5MODEL__);
            }
            case "enum": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token4ENUM__);
            }
            case "type": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token4TYPE__);
            }
            case "true": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token4TRUE__);
            }
            case "false": {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token5FALSE__);
            }
            default: {
              id = _bind$2;
              break _L$3;
            }
          }
        }
        return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token6LIDENT(id));
      } else {
        if (65 <= c && c <= 90) {
          let id;
          _L$3: {
            const _bind$2 = _M0MP38username6prisma6parser9Tokenizer11next__ident(self$2);
            if (_bind$2 === "Unsupported") {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(_M0DTP38username6prisma6parser5Token11UNSUPPORTED__);
            } else {
              id = _bind$2;
              break _L$3;
            }
          }
          return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token6UIDENT(id));
        } else {
          if (c === 34) {
            const _bind$2 = _M0MP38username6prisma6parser9Tokenizer21next__string__literal(self$2);
            let _tmp$2;
            if (_bind$2.$tag === 1) {
              const _ok = _bind$2;
              _tmp$2 = _ok._0;
            } else {
              return _bind$2;
            }
            return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token15STRING__LITERAL(_tmp$2));
          } else {
            if (48 <= c && c <= 57) {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser5Token15NUMBER__LITERAL(_M0MP38username6prisma6parser9Tokenizer21next__number__literal(self$2)));
            } else {
              return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error63username_2fprisma_2fparser_2eTokenError_2eInvalidCharacterError(`invalid character ${_M0IPC14char4CharPB4Show10to__string(c)}`));
            }
          }
        }
      }
    }
  }
}
function _M0MP38username6prisma6parser9Tokenizer4peek(self) {
  if (self.cursor === 0) {
    const _bind = _M0MP38username6prisma6parser9Tokenizer8do__next(self);
    let _tmp;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _tmp = _ok._0;
    } else {
      return _bind;
    }
    self.cur_token = _tmp;
  }
  return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(self.cur_token);
}
function _M0MP38username6prisma6parser9Tokenizer4next(self) {
  const _bind = _M0MP38username6prisma6parser9Tokenizer4peek(self);
  let tok;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    tok = _ok._0;
  } else {
    return _bind;
  }
  const _bind$2 = _M0MP38username6prisma6parser9Tokenizer8do__next(self);
  let _tmp;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    _tmp = _ok._0;
  } else {
    return _bind$2;
  }
  self.cur_token = _tmp;
  return new _M0DTPC16result6ResultGRP38username6prisma6parser5TokenRP38username6prisma6parser10TokenErrorE2Ok(tok);
}
function _M0MP38username6prisma6parser9Tokenizer12match__token(self, expected) {
  const _bind = _M0MP38username6prisma6parser9Tokenizer4peek(self);
  let tok;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    tok = _ok._0;
  } else {
    return _bind;
  }
  if (_M0IP016_24default__implPB2Eq10not__equalGRP38username6prisma6parser5TokenE(tok, expected)) {
    return new _M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(`expected ${_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(expected)}, got ${_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(tok)}`));
  } else {
    const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4next(self);
    if (_bind$2.$tag === 1) {
      const _ok = _bind$2;
      _ok._0;
    } else {
      return _bind$2;
    }
    return new _M0DTPC16result6ResultGuRP38username6prisma6parser10TokenErrorE2Ok(undefined);
  }
}
function _M0FP38username6prisma6parser11parse__args(t) {
  const args = [];
  while (true) {
    const _bind = _M0MP38username6prisma6parser9Tokenizer4peek(t);
    let _bind$2;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _bind$2 = _ok._0;
    } else {
      return _bind;
    }
    let _tmp;
    if (_bind$2.$tag === 16) {
      _tmp = true;
    } else {
      _tmp = false;
    }
    if (!_tmp) {
      let name;
      _L: {
        const _bind$3 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
        let _bind$4;
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          _bind$4 = _ok._0;
        } else {
          return _bind$3;
        }
        if (_bind$4.$tag === 8) {
          const _LIDENT = _bind$4;
          const _name = _LIDENT._0;
          name = _name;
          break _L;
        } else {
          return new _M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected argument name"));
        }
      }
      const _bind$3 = _M0MP38username6prisma6parser9Tokenizer4next(t);
      if (_bind$3.$tag === 1) {
        const _ok = _bind$3;
        _ok._0;
      } else {
        return _bind$3;
      }
      const _bind$4 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token5COLON__);
      if (_bind$4.$tag === 1) {
        const _ok = _bind$4;
        _ok._0;
      } else {
        return _bind$4;
      }
      const _bind$5 = _M0FP38username6prisma6parser22parse__attr__arg__expr(t);
      let value;
      if (_bind$5.$tag === 1) {
        const _ok = _bind$5;
        value = _ok._0;
      } else {
        return _bind$5;
      }
      _M0MPC15array5Array4pushGsE(args, { _0: name, _1: value });
      const _bind$6 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
      let _bind$7;
      if (_bind$6.$tag === 1) {
        const _ok = _bind$6;
        _bind$7 = _ok._0;
      } else {
        return _bind$6;
      }
      if (_bind$7.$tag === 22) {
        const _bind$8 = _M0MP38username6prisma6parser9Tokenizer4next(t);
        if (_bind$8.$tag === 1) {
          const _ok = _bind$8;
          _ok._0;
        } else {
          return _bind$8;
        }
      }
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGUsRP38username6prisma6parser11AttrArgExprEERP38username6prisma6parser10TokenErrorE2Ok(args);
}
function _M0FP38username6prisma6parser22parse__attr__arg__expr(t) {
  const _bind = _M0MP38username6prisma6parser9Tokenizer4peek(t);
  let _tmp;
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _tmp = _ok._0;
  } else {
    return _bind;
  }
  _M0FPB7printlnGRP38username6prisma6parser5TokenE(_tmp);
  let value;
  _L: {
    const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
    let _bind$3;
    if (_bind$2.$tag === 1) {
      const _ok = _bind$2;
      _bind$3 = _ok._0;
    } else {
      return _bind$2;
    }
    if (_bind$3.$tag === 9) {
      const _STRING_LITERAL = _bind$3;
      const _value = _STRING_LITERAL._0;
      value = _value;
      break _L;
    } else {
      let v;
      _L$2: {
        const _bind$4 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
        let _bind$5;
        if (_bind$4.$tag === 1) {
          const _ok = _bind$4;
          _bind$5 = _ok._0;
        } else {
          return _bind$4;
        }
        if (_bind$5.$tag === 10) {
          const _NUMBER_LITERAL = _bind$5;
          const _v = _NUMBER_LITERAL._0;
          v = _v;
          break _L$2;
        } else {
          const _bind$6 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
          let _bind$7;
          if (_bind$6.$tag === 1) {
            const _ok = _bind$6;
            _bind$7 = _ok._0;
          } else {
            return _bind$6;
          }
          if (_bind$7.$tag === 11) {
            const _bind$8 = _M0MP38username6prisma6parser9Tokenizer4next(t);
            if (_bind$8.$tag === 1) {
              const _ok = _bind$8;
              _ok._0;
            } else {
              return _bind$8;
            }
            return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr("true"));
          } else {
            const _bind$8 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
            let _bind$9;
            if (_bind$8.$tag === 1) {
              const _ok = _bind$8;
              _bind$9 = _ok._0;
            } else {
              return _bind$8;
            }
            if (_bind$9.$tag === 12) {
              const _bind$10 = _M0MP38username6prisma6parser9Tokenizer4next(t);
              if (_bind$10.$tag === 1) {
                const _ok = _bind$10;
                _ok._0;
              } else {
                return _bind$10;
              }
              return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr("false"));
            } else {
              const _bind$10 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
              let _bind$11;
              if (_bind$10.$tag === 1) {
                const _ok = _bind$10;
                _bind$11 = _ok._0;
              } else {
                return _bind$10;
              }
              if (_bind$11.$tag === 13) {
                const _bind$12 = _M0MP38username6prisma6parser9Tokenizer4next(t);
                if (_bind$12.$tag === 1) {
                  const _ok = _bind$12;
                  _ok._0;
                } else {
                  return _bind$12;
                }
                const fields = [];
                while (true) {
                  const _bind$13 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
                  let _bind$14;
                  if (_bind$13.$tag === 1) {
                    const _ok = _bind$13;
                    _bind$14 = _ok._0;
                  } else {
                    return _bind$13;
                  }
                  let _tmp$2;
                  if (_bind$14.$tag === 14) {
                    _tmp$2 = true;
                  } else {
                    _tmp$2 = false;
                  }
                  if (!_tmp$2) {
                    let field;
                    _L$3: {
                      const _bind$15 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
                      let _bind$16;
                      if (_bind$15.$tag === 1) {
                        const _ok = _bind$15;
                        _bind$16 = _ok._0;
                      } else {
                        return _bind$15;
                      }
                      if (_bind$16.$tag === 8) {
                        const _LIDENT = _bind$16;
                        const _field = _LIDENT._0;
                        field = _field;
                        break _L$3;
                      } else {
                        return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected field name in list"));
                      }
                    }
                    const _bind$15 = _M0MP38username6prisma6parser9Tokenizer4next(t);
                    if (_bind$15.$tag === 1) {
                      const _ok = _bind$15;
                      _ok._0;
                    } else {
                      return _bind$15;
                    }
                    _M0MPC15array5Array4pushGsE(fields, field);
                    const _bind$16 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
                    let _bind$17;
                    if (_bind$16.$tag === 1) {
                      const _ok = _bind$16;
                      _bind$17 = _ok._0;
                    } else {
                      return _bind$16;
                    }
                    if (_bind$17.$tag === 22) {
                      const _bind$18 = _M0MP38username6prisma6parser9Tokenizer4next(t);
                      if (_bind$18.$tag === 1) {
                        const _ok = _bind$18;
                        _ok._0;
                      } else {
                        return _bind$18;
                      }
                    }
                    continue;
                  } else {
                    break;
                  }
                }
                const _bind$13 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token8RBRACKET__);
                if (_bind$13.$tag === 1) {
                  const _ok = _bind$13;
                  _ok._0;
                } else {
                  return _bind$13;
                }
                return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr9FieldList(fields));
              } else {
                let name;
                _L$3: {
                  const _bind$12 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
                  let _bind$13;
                  if (_bind$12.$tag === 1) {
                    const _ok = _bind$12;
                    _bind$13 = _ok._0;
                  } else {
                    return _bind$12;
                  }
                  if (_bind$13.$tag === 8) {
                    const _LIDENT = _bind$13;
                    const _name = _LIDENT._0;
                    name = _name;
                    break _L$3;
                  } else {
                    return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected attribute argument expression"));
                  }
                }
                const _bind$12 = _M0MP38username6prisma6parser9Tokenizer4next(t);
                if (_bind$12.$tag === 1) {
                  const _ok = _bind$12;
                  _ok._0;
                } else {
                  return _bind$12;
                }
                const _bind$13 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6LPAREN__);
                if (_bind$13.$tag === 1) {
                  const _ok = _bind$13;
                  _ok._0;
                } else {
                  return _bind$13;
                }
                const _bind$14 = _M0FP38username6prisma6parser11parse__args(t);
                let args;
                if (_bind$14.$tag === 1) {
                  const _ok = _bind$14;
                  args = _ok._0;
                } else {
                  return _bind$14;
                }
                const _bind$15 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RPAREN__);
                if (_bind$15.$tag === 1) {
                  const _ok = _bind$15;
                  _ok._0;
                } else {
                  return _bind$15;
                }
                return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr12FunctionCall(name, args));
              }
            }
          }
        }
      }
      const _bind$4 = _M0MP38username6prisma6parser9Tokenizer4next(t);
      if (_bind$4.$tag === 1) {
        const _ok = _bind$4;
        _ok._0;
      } else {
        return _bind$4;
      }
      return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr(v));
    }
  }
  const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4next(t);
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    _ok._0;
  } else {
    return _bind$2;
  }
  return new _M0DTPC16result6ResultGRP38username6prisma6parser11AttrArgExprRP38username6prisma6parser10TokenErrorE2Ok(new _M0DTP38username6prisma6parser11AttrArgExpr10SimpleExpr(value));
}
function _M0FP38username6prisma6parser12parse__field(t) {
  let name;
  _L: {
    const _bind = _M0MP38username6prisma6parser9Tokenizer4peek(t);
    let _bind$2;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _bind$2 = _ok._0;
    } else {
      return _bind;
    }
    if (_bind$2.$tag === 8) {
      const _LIDENT = _bind$2;
      const _name = _LIDENT._0;
      name = _name;
      break _L;
    } else {
      return new _M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE2Ok(undefined);
    }
  }
  const _bind = _M0MP38username6prisma6parser9Tokenizer4next(t);
  if (_bind.$tag === 1) {
    const _ok = _bind;
    _ok._0;
  } else {
    return _bind;
  }
  let type_name;
  _L$2: {
    const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4next(t);
    let _bind$3;
    if (_bind$2.$tag === 1) {
      const _ok = _bind$2;
      _bind$3 = _ok._0;
    } else {
      return _bind$2;
    }
    if (_bind$3.$tag === 7) {
      const _UIDENT = _bind$3;
      const _type_name = _UIDENT._0;
      type_name = _type_name;
      break _L$2;
    } else {
      return new _M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected field type"));
    }
  }
  const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
  let _bind$3;
  if (_bind$2.$tag === 1) {
    const _ok = _bind$2;
    _bind$3 = _ok._0;
  } else {
    return _bind$2;
  }
  let type_;
  if (_bind$3.$tag === 13) {
    const _bind$4 = _M0MP38username6prisma6parser9Tokenizer4next(t);
    if (_bind$4.$tag === 1) {
      const _ok = _bind$4;
      _ok._0;
    } else {
      return _bind$4;
    }
    const _bind$5 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token8RBRACKET__);
    if (_bind$5.$tag === 1) {
      const _ok = _bind$5;
      _ok._0;
    } else {
      return _bind$5;
    }
    type_ = new _M0DTP38username6prisma6parser9FieldType8ListType(type_name);
  } else {
    type_ = new _M0DTP38username6prisma6parser9FieldType10SimpleType(type_name);
  }
  const _bind$4 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
  let _bind$5;
  if (_bind$4.$tag === 1) {
    const _ok = _bind$4;
    _bind$5 = _ok._0;
  } else {
    return _bind$4;
  }
  let required;
  if (_bind$5.$tag === 19) {
    const _bind$6 = _M0MP38username6prisma6parser9Tokenizer4next(t);
    if (_bind$6.$tag === 1) {
      const _ok = _bind$6;
      _ok._0;
    } else {
      return _bind$6;
    }
    required = false;
  } else {
    required = true;
  }
  const attributes = [];
  while (true) {
    let name$2;
    _L$3: {
      const _bind$6 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
      let _bind$7;
      if (_bind$6.$tag === 1) {
        const _ok = _bind$6;
        _bind$7 = _ok._0;
      } else {
        return _bind$6;
      }
      if (_bind$7.$tag === 23) {
        const _AT_ATTRIBUTE = _bind$7;
        const _name = _AT_ATTRIBUTE._0;
        name$2 = _name;
        break _L$3;
      } else {
        break;
      }
    }
    const _bind$6 = _M0MP38username6prisma6parser9Tokenizer4next(t);
    if (_bind$6.$tag === 1) {
      const _ok = _bind$6;
      _ok._0;
    } else {
      return _bind$6;
    }
    const _bind$7 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
    let _bind$8;
    if (_bind$7.$tag === 1) {
      const _ok = _bind$7;
      _bind$8 = _ok._0;
    } else {
      return _bind$7;
    }
    if (_bind$8.$tag === 15) {
      const _bind$9 = _M0MP38username6prisma6parser9Tokenizer4next(t);
      if (_bind$9.$tag === 1) {
        const _ok = _bind$9;
        _ok._0;
      } else {
        return _bind$9;
      }
      const _bind$10 = _M0FP38username6prisma6parser11parse__args(t);
      let args;
      if (_bind$10.$tag === 1) {
        const _ok = _bind$10;
        args = _ok._0;
      } else {
        return _bind$10;
      }
      const _bind$11 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RPAREN__);
      if (_bind$11.$tag === 1) {
        const _ok = _bind$11;
        _ok._0;
      } else {
        return _bind$11;
      }
      _M0MPC15array5Array4pushGsE(attributes, new _M0DTP38username6prisma6parser9Attribute12FunctionAttr(name$2, args));
    } else {
      _M0MPC15array5Array4pushGsE(attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr(name$2));
    }
    continue;
  }
  return new _M0DTPC16result6ResultGORP38username6prisma6parser5FieldRP38username6prisma6parser10TokenErrorE2Ok(new _M0TP38username6prisma6parser5Field(name, type_, required, attributes));
}
function _M0FP38username6prisma6parser5parse(t) {
  const phases = [];
  _L: while (true) {
    const _bind = _M0MP38username6prisma6parser9Tokenizer4next(t);
    let tok;
    if (_bind.$tag === 1) {
      const _ok = _bind;
      tok = _ok._0;
    } else {
      return _bind;
    }
    switch (tok.$tag) {
      case 0: {
        let name;
        _L$2: {
          const _bind$2 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          let _bind$3;
          if (_bind$2.$tag === 1) {
            const _ok = _bind$2;
            _bind$3 = _ok._0;
          } else {
            return _bind$2;
          }
          if (_bind$3.$tag === 8) {
            const _LIDENT = _bind$3;
            const _name = _LIDENT._0;
            name = _name;
            break _L$2;
          } else {
            return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(tok)));
          }
        }
        const _bind$2 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6LBRACE__);
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          _ok._0;
        } else {
          return _bind$2;
        }
        const _bind$3 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token8PROVIDER__);
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          _ok._0;
        } else {
          return _bind$3;
        }
        const _bind$4 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token5EQUAL__);
        if (_bind$4.$tag === 1) {
          const _ok = _bind$4;
          _ok._0;
        } else {
          return _bind$4;
        }
        let provider;
        _L$3: {
          const _bind$5 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          let _bind$6;
          if (_bind$5.$tag === 1) {
            const _ok = _bind$5;
            _bind$6 = _ok._0;
          } else {
            return _bind$5;
          }
          if (_bind$6.$tag === 9) {
            const _STRING_LITERAL = _bind$6;
            const _provider = _STRING_LITERAL._0;
            provider = _provider;
            break _L$3;
          } else {
            return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected string literal for provider"));
          }
        }
        const _bind$5 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token3URL__);
        if (_bind$5.$tag === 1) {
          const _ok = _bind$5;
          _ok._0;
        } else {
          return _bind$5;
        }
        const _bind$6 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token5EQUAL__);
        if (_bind$6.$tag === 1) {
          const _ok = _bind$6;
          _ok._0;
        } else {
          return _bind$6;
        }
        let url;
        _L$4: {
          const _bind$7 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          let _bind$8;
          if (_bind$7.$tag === 1) {
            const _ok = _bind$7;
            _bind$8 = _ok._0;
          } else {
            return _bind$7;
          }
          if (_bind$8.$tag === 9) {
            const _STRING_LITERAL = _bind$8;
            const _url = _STRING_LITERAL._0;
            url = _url;
            break _L$4;
          } else {
            return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError("Expected string literal for url"));
          }
        }
        const _bind$7 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RBRACE__);
        if (_bind$7.$tag === 1) {
          const _ok = _bind$7;
          _ok._0;
        } else {
          return _bind$7;
        }
        _M0MPC15array5Array4pushGsE(phases, new _M0DTP38username6prisma6parser5Phase10Datasource(name, provider, url));
        break;
      }
      case 3: {
        let name$2;
        _L$5: {
          const _bind$8 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          let _bind$9;
          if (_bind$8.$tag === 1) {
            const _ok = _bind$8;
            _bind$9 = _ok._0;
          } else {
            return _bind$8;
          }
          if (_bind$9.$tag === 7) {
            const _UIDENT = _bind$9;
            const _name = _UIDENT._0;
            name$2 = _name;
            break _L$5;
          } else {
            return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(tok)));
          }
        }
        const _bind$8 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6LBRACE__);
        if (_bind$8.$tag === 1) {
          const _ok = _bind$8;
          _ok._0;
        } else {
          return _bind$8;
        }
        const fields = [];
        while (true) {
          let field;
          _L$6: {
            const _bind$9 = _M0FP38username6prisma6parser12parse__field(t);
            let _bind$10;
            if (_bind$9.$tag === 1) {
              const _ok = _bind$9;
              _bind$10 = _ok._0;
            } else {
              return _bind$9;
            }
            if (_bind$10 === undefined) {
              break;
            } else {
              const _Some = _bind$10;
              const _field = _Some;
              field = _field;
              break _L$6;
            }
          }
          _M0MPC15array5Array4pushGsE(fields, field);
          continue;
        }
        const attributes = [];
        while (true) {
          let name$3;
          _L$6: {
            const _bind$9 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
            let _bind$10;
            if (_bind$9.$tag === 1) {
              const _ok = _bind$9;
              _bind$10 = _ok._0;
            } else {
              return _bind$9;
            }
            if (_bind$10.$tag === 24) {
              const _ATAT_ATTRIBUTE = _bind$10;
              const _name = _ATAT_ATTRIBUTE._0;
              name$3 = _name;
              break _L$6;
            } else {
              break;
            }
          }
          const _bind$9 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          if (_bind$9.$tag === 1) {
            const _ok = _bind$9;
            _ok._0;
          } else {
            return _bind$9;
          }
          const _bind$10 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
          let _bind$11;
          if (_bind$10.$tag === 1) {
            const _ok = _bind$10;
            _bind$11 = _ok._0;
          } else {
            return _bind$10;
          }
          if (_bind$11.$tag === 15) {
            const _bind$12 = _M0MP38username6prisma6parser9Tokenizer4next(t);
            if (_bind$12.$tag === 1) {
              const _ok = _bind$12;
              _ok._0;
            } else {
              return _bind$12;
            }
            const _bind$13 = _M0FP38username6prisma6parser11parse__args(t);
            let args;
            if (_bind$13.$tag === 1) {
              const _ok = _bind$13;
              args = _ok._0;
            } else {
              return _bind$13;
            }
            const _bind$14 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RPAREN__);
            if (_bind$14.$tag === 1) {
              const _ok = _bind$14;
              _ok._0;
            } else {
              return _bind$14;
            }
            _M0MPC15array5Array4pushGsE(attributes, new _M0DTP38username6prisma6parser9Attribute12FunctionAttr(name$3, args));
          } else {
            _M0MPC15array5Array4pushGsE(attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr(name$3));
          }
          continue;
        }
        const _bind$9 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RBRACE__);
        if (_bind$9.$tag === 1) {
          const _ok = _bind$9;
          _ok._0;
        } else {
          return _bind$9;
        }
        _M0MPC15array5Array4pushGsE(phases, new _M0DTP38username6prisma6parser5Phase5Model(name$2, fields, attributes));
        break;
      }
      case 4: {
        let name$3;
        _L$6: {
          const _bind$10 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          let _bind$11;
          if (_bind$10.$tag === 1) {
            const _ok = _bind$10;
            _bind$11 = _ok._0;
          } else {
            return _bind$10;
          }
          if (_bind$11.$tag === 7) {
            const _UIDENT = _bind$11;
            const _name = _UIDENT._0;
            name$3 = _name;
            break _L$6;
          } else {
            return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(tok)));
          }
        }
        const _bind$10 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6LBRACE__);
        if (_bind$10.$tag === 1) {
          const _ok = _bind$10;
          _ok._0;
        } else {
          return _bind$10;
        }
        const values = [];
        while (true) {
          let value;
          _L$7: {
            const _bind$11 = _M0MP38username6prisma6parser9Tokenizer4peek(t);
            let _bind$12;
            if (_bind$11.$tag === 1) {
              const _ok = _bind$11;
              _bind$12 = _ok._0;
            } else {
              return _bind$11;
            }
            if (_bind$12.$tag === 7) {
              const _UIDENT = _bind$12;
              const _value = _UIDENT._0;
              value = _value;
              break _L$7;
            } else {
              break;
            }
          }
          const _bind$11 = _M0MP38username6prisma6parser9Tokenizer4next(t);
          if (_bind$11.$tag === 1) {
            const _ok = _bind$11;
            _ok._0;
          } else {
            return _bind$11;
          }
          _M0MPC15array5Array4pushGsE(values, value);
          continue;
        }
        const _bind$11 = _M0MP38username6prisma6parser9Tokenizer12match__token(t, _M0DTP38username6prisma6parser5Token6RBRACE__);
        if (_bind$11.$tag === 1) {
          const _ok = _bind$11;
          _ok._0;
        } else {
          return _bind$11;
        }
        _M0MPC15array5Array4pushGsE(phases, new _M0DTP38username6prisma6parser5Phase4Enum(name$3, values));
        break;
      }
      case 25: {
        break _L;
      }
      default: {
        return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE3Err(new _M0DTPC15error5Error62username_2fprisma_2fparser_2eTokenError_2eUnexpectedTokenError(_M0IP016_24default__implPB4Show10to__stringGRP38username6prisma6parser5TokenE(tok)));
      }
    }
    continue;
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGRP38username6prisma6parser5PhaseERP38username6prisma6parser10TokenErrorE2Ok(phases);
}
function _M0MP38username6prisma6parser9Tokenizer4make(src) {
  return new _M0TP38username6prisma6parser9Tokenizer(0, 0, src, _M0DTP38username6prisma6parser5Token3EOF__);
}
function _M0FP38username6prisma6parser14is__base__type(type_name) {
  return type_name === "Int" || (type_name === "Float" || (type_name === "String" || type_name === "Boolean"));
}
function _M0FP38username6prisma6parser15is__base__field(f) {
  let t;
  _L: {
    const _bind = f.type_;
    if (_bind.$tag === 0) {
      const _SimpleType = _bind;
      const _t = _SimpleType._0;
      t = _t;
      break _L;
    } else {
      return false;
    }
  }
  return _M0FP38username6prisma6parser14is__base__type(t);
}
function _M0FP38username6prisma6parser19is__model__or__list(f) {
  let t;
  _L: {
    const _bind = f.type_;
    if (_bind.$tag === 1) {
      return true;
    } else {
      const _SimpleType = _bind;
      const _t = _SimpleType._0;
      t = _t;
      break _L;
    }
  }
  return !_M0FP38username6prisma6parser14is__base__type(t);
}
function _M0FP38username6prisma6parser20find__attr__by__name(attrs, name) {
  const i = _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(attrs, (a) => _M0MP38username6prisma6parser9Attribute9get__name(a) === name);
  let n;
  _L: {
    if (i === undefined) {
      return undefined;
    } else {
      const _Some = i;
      const _n = _Some;
      n = _n;
      break _L;
    }
  }
  return _M0MPC15array5Array2atGsE(attrs, n);
}
function _M0FP38username6prisma6parser16gen__dumb__model(name, fields) {
  const base_fields = _M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field);
  const optional_fields = _M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(base_fields, (f) => !f.required || (_M0MPC15array5Array8containsGRP38username6prisma6parser9AttributeE(f.attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr("@id")) && _M0IP38username6prisma6parser9FieldTypePB2Eq5equal(f.type_, new _M0DTP38username6prisma6parser9FieldType10SimpleType("Int")) || _M0MPC16option6Option7map__orGRP38username6prisma6parser9AttributebE(_M0FP38username6prisma6parser20find__attr__by__name(f.attributes, "@default"), false, (_discard_) => true)));
  const _tmp = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(optional_fields, (f) => `\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"`);
  const _bind = " | ";
  const optional_list = _M0MPC15array5Array4joinGsE(_tmp, new _M0TPC16string10StringView(_bind, 0, _bind.length));
  const optional_list$2 = optional_list === "" ? "never" : optional_list;
  const _tmp$2 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(base_fields, (f) => `\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"`);
  const _bind$2 = ", ";
  const base_fields_str = _M0MPC15array5Array4joinGsE(_tmp$2, new _M0TPC16string10StringView(_bind$2, 0, _bind$2.length));
  return `export type ${_M0IPC16string6StringPB4Show10to__string(name)}Criteria = Partial<Criteria<${_M0IPC16string6StringPB4Show10to__string(name)}Base>>\nexport type ${_M0IPC16string6StringPB4Show10to__string(name)}Insert = CreateModel<${_M0IPC16string6StringPB4Show10to__string(name)}Base, ${_M0IPC16string6StringPB4Show10to__string(optional_list$2)}>\nconst ${_M0IPC16string6StringPB4Show10to__string(name)}BaseFields = [${_M0IPC16string6StringPB4Show10to__string(base_fields_str)}]\nexport const ${_M0IPC16string6StringPB4Show10to__string(name)} = {\n  findBy: <T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\"> = {}>(criteria: ${_M0IPC16string6StringPB4Show10to__string(name)}Criteria, relation?: T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\"> ? T : never) => {\n    return [] as unknown as (${_M0IPC16string6StringPB4Show10to__string(name)}Base & DeepPick<\"${_M0IPC16string6StringPB4Show10to__string(name)}Rel\", T>)[]\n  },\n  findOne: <T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\"> = {}>(criteria: ${_M0IPC16string6StringPB4Show10to__string(name)}Criteria, relation?: T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\"> ? T : never) => {\n    return ${_M0IPC16string6StringPB4Show10to__string(name)}.findBy(criteria, relation).at(0)\n  },\n  insert: (data: ${_M0IPC16string6StringPB4Show10to__string(name)}Insert[]) => ({} as StatementResultingChanges),\n  remove: (criteria: Partial<Criteria<${_M0IPC16string6StringPB4Show10to__string(name)}Base>>) => remove(\"${_M0IPC16string6StringPB4Show10to__string(name)}\", ${_M0IPC16string6StringPB4Show10to__string(name)}BaseFields, criteria),\n  update: <T extends Partial<${_M0IPC16string6StringPB4Show10to__string(name)}Base>>(criteria: {} extends T ? never : Partial<Criteria<${_M0IPC16string6StringPB4Show10to__string(name)}Base>>, patch: T) => update(\"${_M0IPC16string6StringPB4Show10to__string(name)}\", ${_M0IPC16string6StringPB4Show10to__string(name)}BaseFields, criteria, patch)\n};\n`;
}
function _M0FP38username6prisma6parser13relation__kvs(f) {
  const i = _M0MPC16option6Option6unwrapGiE(_M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(f.attributes, (a) => {
    if (a.$tag === 1) {
      const _FunctionAttr = a;
      const _x = _FunctionAttr._0;
      if (_x === "@relation") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }));
  _L: {
    let fs;
    let rs;
    _L$2: {
      const _bind = _M0MPC15array5Array2atGsE(f.attributes, i);
      if (_bind.$tag === 1) {
        const _FunctionAttr = _bind;
        const _x = _FunctionAttr._0;
        if (_x === "@relation") {
          const _x$2 = _FunctionAttr._1;
          if (_x$2.length === 2) {
            const _x$3 = _x$2[0];
            const _x$4 = _x$3._0;
            if (_x$4 === "fields") {
              const _x$5 = _x$3._1;
              if (_x$5.$tag === 1) {
                const _FieldList = _x$5;
                const _fs = _FieldList._0;
                const _x$6 = _x$2[1];
                const _x$7 = _x$6._0;
                if (_x$7 === "references") {
                  const _x$8 = _x$6._1;
                  if (_x$8.$tag === 1) {
                    const _FieldList$2 = _x$8;
                    const _rs = _FieldList$2._0;
                    fs = _fs;
                    rs = _rs;
                    break _L$2;
                  } else {
                    break _L;
                  }
                } else {
                  break _L;
                }
              } else {
                break _L;
              }
            } else {
              break _L;
            }
          } else {
            break _L;
          }
        } else {
          break _L;
        }
      } else {
        break _L;
      }
    }
    const _bind = _M0FPB10assert__eqGiE(fs.length, rs.length, undefined, "src/parser/gen_code.mbt:186:3-186:38@username/prisma");
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _ok._0;
    } else {
      return _bind;
    }
    return new _M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE2Ok(_M0MPC15array5Array3zipGssE(fs, rs));
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGUssEERPC15error5ErrorE2Ok($panic());
}
function _M0FP38username6prisma6parser10gen__model(name, fields, phases) {
  const _tmp = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (f) => f.name);
  const _bind = ", ";
  const field_list = _M0MPC15array5Array4joinGsE(_tmp, new _M0TPC16string10StringView(_bind, 0, _bind.length));
  const _tmp$2 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (_discard_) => "?");
  const _bind$2 = ", ";
  const placeholder_list = _M0MPC15array5Array4joinGsE(_tmp$2, new _M0TPC16string10StringView(_bind$2, 0, _bind$2.length));
  const optional_fields = _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldURP38username6prisma6parser5FieldsEE(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (f) => {
    const default_ = _M0FP38username6prisma6parser20find__attr__by__name(f.attributes, "@default");
    if (!f.required || _M0MPC15array5Array8containsGRP38username6prisma6parser9AttributeE(f.attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr("@id")) && _M0IP38username6prisma6parser9FieldTypePB2Eq5equal(f.type_, new _M0DTP38username6prisma6parser9FieldType10SimpleType("Int"))) {
      return { _0: f, _1: "null" };
    } else {
      let attr;
      _L: {
        if (default_ === undefined) {
          return undefined;
        } else {
          const _Some = default_;
          const _attr = _Some;
          attr = _attr;
          break _L;
        }
      }
      _L$2: {
        let raw;
        _L$3: {
          if (attr.$tag === 1) {
            const _FunctionAttr = attr;
            const _x = _FunctionAttr._0;
            if (_x === "@default") {
              const _x$2 = _FunctionAttr._1;
              if (_x$2.length === 1) {
                const _x$3 = _x$2[0];
                const _x$4 = _x$3._0;
                if (_x$4 === "raw") {
                  const _x$5 = _x$3._1;
                  if (_x$5.$tag === 0) {
                    const _SimpleExpr = _x$5;
                    const _raw = _SimpleExpr._0;
                    raw = _raw;
                    break _L$3;
                  } else {
                    break _L$2;
                  }
                } else {
                  break _L$2;
                }
              } else {
                break _L$2;
              }
            } else {
              break _L$2;
            }
          } else {
            break _L$2;
          }
        }
        return { _0: f, _1: raw };
      }
      return $panic();
    }
  });
  const _tmp$3 = _M0MPC15array5Array3mapGURP38username6prisma6parser5FieldsEsE(optional_fields, (f) => `\"${_M0IPC16string6StringPB4Show10to__string(f._0.name)}\"`);
  const _bind$3 = " | ";
  const optional_list = _M0MPC15array5Array4joinGsE(_tmp$3, new _M0TPC16string10StringView(_bind$3, 0, _bind$3.length));
  const optional_list$2 = optional_list === "" ? "never" : optional_list;
  const _tmp$4 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (f) => {
    const nullable = _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(optional_fields, (ff) => ff._0.name === f.name);
    let i;
    _L: {
      if (nullable === undefined) {
        return _M0IP38username6prisma6parser9FieldTypePB2Eq5equal(f.type_, new _M0DTP38username6prisma6parser9FieldType10SimpleType("Boolean")) ? `Number(row[\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"])` : `row[\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"]`;
      } else {
        const _Some = nullable;
        const _i = _Some;
        i = _i;
        break _L;
      }
    }
    const default_str = _M0MPC15array5Array2atGsE(optional_fields, i)._1;
    return `row[\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"] ?? ${_M0IPC16string6StringPB4Show10to__string(default_str)}`;
  });
  const _bind$4 = ", ";
  const value_list = _M0MPC15array5Array4joinGsE(_tmp$4, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
  const _bind$5 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsEHRPC15error5Error(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser19is__model__or__list), (f) => {
    let n;
    _L: {
      let n$2;
      _L$2: {
        const _bind$6 = f.type_;
        if (_bind$6.$tag === 0) {
          const _SimpleType = _bind$6;
          const _n = _SimpleType._0;
          n$2 = _n;
          break _L$2;
        } else {
          const _ListType = _bind$6;
          const _n = _ListType._0;
          n = _n;
          break _L;
        }
      }
      const p = _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(phases, (p$2) => {
        let name$2;
        _L$3: {
          if (p$2.$tag === 1) {
            const _Model = p$2;
            const _name = _Model._0;
            name$2 = _name;
            break _L$3;
          } else {
            return false;
          }
        }
        return n$2 === name$2;
      });
      let i;
      _L$3: {
        if (p === undefined) {
          return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(`${_M0IPC16string6StringPB4Show10to__string(f.name)}: (row) => {}`);
        } else {
          const _Some = p;
          const _i = _Some;
          i = _i;
          break _L$3;
        }
      }
      const ff = _M0MPC15array5Array2atGsE(phases, i);
      let name$2;
      _L$4: {
        if (ff.$tag === 1) {
          const _Model = ff;
          const _name = _Model._0;
          name$2 = _name;
          break _L$4;
        } else {
          return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok($panic());
        }
      }
      const _bind$6 = _M0FP38username6prisma6parser13relation__kvs(f);
      let kv;
      if (_bind$6.$tag === 1) {
        const _ok = _bind$6;
        kv = _ok._0;
      } else {
        return _bind$6;
      }
      const _tmp$5 = _M0MPC15array5Array3mapGUssEsE(kv, (kv$2) => {
        let v;
        let k;
        _L$5: {
          const _v = kv$2._0;
          const _k = kv$2._1;
          v = _v;
          k = _k;
          break _L$5;
        }
        return `${_M0IPC16string6StringPB4Show10to__string(k)}: row.${_M0IPC16string6StringPB4Show10to__string(v)}`;
      });
      const _bind$7 = ", ";
      const kvs_str = _M0MPC15array5Array4joinGsE(_tmp$5, new _M0TPC16string10StringView(_bind$7, 0, _bind$7.length));
      return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(`${_M0IPC16string6StringPB4Show10to__string(f.name)}: (row) => {\nconst t = ${_M0IPC16string6StringPB4Show10to__string(name$2)}.findBy({${_M0IPC16string6StringPB4Show10to__string(kvs_str)}}).at(0)\nassert(t)\nrow.${_M0IPC16string6StringPB4Show10to__string(f.name)} = t\n}`);
    }
    _M0FPB7printlnGsE("ListType");
    const p = _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(phases, (p$2) => {
      let name$2;
      _L$2: {
        if (p$2.$tag === 1) {
          const _Model = p$2;
          const _name = _Model._0;
          name$2 = _name;
          break _L$2;
        } else {
          return false;
        }
      }
      return n === name$2;
    });
    _M0FPB7printlnGOiE(p);
    const p$2 = _M0MPC16option6Option6unwrapGiE(p);
    const m = _M0MPC15array5Array2atGsE(phases, p$2);
    const model_name = name;
    let name$2;
    let fields$2;
    _L$2: {
      if (m.$tag === 1) {
        const _Model = m;
        const _name = _Model._0;
        const _fields = _Model._1;
        name$2 = _name;
        fields$2 = _fields;
        break _L$2;
      } else {
        return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok($panic());
      }
    }
    const i = _M0MPC15array5Array10search__byGURP38username6prisma6parser5FieldsEE(fields$2, (f$2) => {
      let nn;
      _L$3: {
        const _bind$6 = f$2.type_;
        if (_bind$6.$tag === 0) {
          const _SimpleType = _bind$6;
          const _nn = _SimpleType._0;
          nn = _nn;
          break _L$3;
        } else {
          return false;
        }
      }
      return nn === model_name;
    });
    const i$2 = _M0MPC16option6Option6unwrapGiE(i);
    const ff = _M0MPC15array5Array2atGsE(fields$2, i$2);
    const _bind$6 = _M0FP38username6prisma6parser13relation__kvs(ff);
    let kv;
    if (_bind$6.$tag === 1) {
      const _ok = _bind$6;
      kv = _ok._0;
    } else {
      return _bind$6;
    }
    const _tmp$5 = _M0MPC15array5Array3mapGUssEsE(kv, (kv$2) => {
      let k;
      let v;
      _L$3: {
        const _k = kv$2._0;
        const _v = kv$2._1;
        k = _k;
        v = _v;
        break _L$3;
      }
      return `${_M0IPC16string6StringPB4Show10to__string(k)}: row.${_M0IPC16string6StringPB4Show10to__string(v)}`;
    });
    const _bind$7 = ", ";
    const kvs_str = _M0MPC15array5Array4joinGsE(_tmp$5, new _M0TPC16string10StringView(_bind$7, 0, _bind$7.length));
    return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(`${_M0IPC16string6StringPB4Show10to__string(f.name)}: (row) => {\nrow.${_M0IPC16string6StringPB4Show10to__string(f.name)} = ${_M0IPC16string6StringPB4Show10to__string(name$2)}.findBy({${_M0IPC16string6StringPB4Show10to__string(kvs_str)}}, typeof relation![\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"] === \"object\" ? relation![\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"] : undefined)\n}`);
  });
  let _tmp$5;
  if (_bind$5.$tag === 1) {
    const _ok = _bind$5;
    _tmp$5 = _ok._0;
  } else {
    return _bind$5;
  }
  const _tmp$6 = _tmp$5;
  const _bind$6 = ",\n";
  const relation_str = _M0MPC15array5Array4joinGsE(_tmp$6, new _M0TPC16string10StringView(_bind$6, 0, _bind$6.length));
  const a = `{ ${_M0IPC16string6StringPB4Show10to__string(relation_str)} }`;
  _M0FPB7printlnGsE(`Referenced models: ${a}`);
  const _tmp$7 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsE(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, (f) => _M0IP38username6prisma6parser9FieldTypePB2Eq5equal(f.type_, new _M0DTP38username6prisma6parser9FieldType10SimpleType("Boolean"))), (f) => `_row[\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"] = Boolean(_row[\"${_M0IPC16string6StringPB4Show10to__string(f.name)}\"])`);
  const _bind$7 = "\n";
  const boolean_transform = _M0MPC15array5Array4joinGsE(_tmp$7, new _M0TPC16string10StringView(_bind$7, 0, _bind$7.length));
  const ret = `  ${_M0IPC16string6StringPB4Show10to__string(name)}.findBy = <T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\">>(criteria: ${_M0IPC16string6StringPB4Show10to__string(name)}Criteria, relation?: T extends Cas<\"${_M0IPC16string6StringPB4Show10to__string(name)}\"> ? T : never) => {\n    const rels: Record<string, (row: any) => void> = ${_M0IPC16string6StringPB4Show10to__string(a)}\n    let ret = db.prepare(\"SELECT * FROM ${_M0IPC16string6StringPB4Show10to__string(name)} \" + makeWhere(criteria)).all()\n    ret = ret.map(row => {\n      Object.entries(rels).forEach(([k, v]) => {\n        if (relation && Object.keys(relation).includes(k)) {\n        v(row)\n      }\n    })\n      const _row = row as any\n      ${_M0IPC16string6StringPB4Show10to__string(boolean_transform)}\n      return row\n    })\n    return ret as any\n  }\n\n  ${_M0IPC16string6StringPB4Show10to__string(name)}.insert = (data: CreateModel<${_M0IPC16string6StringPB4Show10to__string(name)}Base, ${_M0IPC16string6StringPB4Show10to__string(optional_list$2)}>[]) => {\n    const values_str = \",(${_M0IPC16string6StringPB4Show10to__string(placeholder_list)})\".repeat(data.length).slice(1)\n    const stmt = db.prepare('INSERT INTO ${_M0IPC16string6StringPB4Show10to__string(name)} (${_M0IPC16string6StringPB4Show10to__string(field_list)}) VALUES ' + values_str)\n    const values = data.map(row => [${_M0IPC16string6StringPB4Show10to__string(value_list)}]).flat()\n    return stmt.run(...values)\n  }\n\n\n`;
  return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(ret);
}
function _M0FP38username6prisma6parser9gen__init(phase) {
  const init = new _M0TPB8MutLocalGsE("");
  const _bind = phase.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const p = phase[_];
      let fields;
      let name;
      let attributes;
      _L: {
        _L$2: {
          if (p.$tag === 1) {
            const _Model = p;
            const _name = _Model._0;
            const _fields = _Model._1;
            const _attributes = _Model._2;
            fields = _fields;
            name = _name;
            attributes = _attributes;
            break _L$2;
          }
          break _L;
        }
        const _bind$2 = _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldsEHRPB7Failure(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (f) => {
          let t;
          _L$3: {
            const _bind$3 = f.type_;
            if (_bind$3.$tag === 0) {
              const _SimpleType = _bind$3;
              const _t = _SimpleType._0;
              t = _t;
              break _L$3;
            } else {
              return new _M0DTPC16result6ResultGOsRPB7FailureE2Ok(undefined);
            }
          }
          let t$2;
          switch (t) {
            case "Int": {
              t$2 = "INTEGER";
              break;
            }
            case "Float": {
              t$2 = "REAL";
              break;
            }
            case "String": {
              t$2 = "TEXT";
              break;
            }
            case "Boolean": {
              t$2 = "BOOLEAN";
              break;
            }
            default: {
              const _bind$3 = _M0FPB4failGsE(`Not supported type ${_M0IPC16string6StringPB4Show10to__string(t)}!`, "src/parser/gen_code.mbt:370:24-370:56@username/prisma");
              if (_bind$3.$tag === 1) {
                const _ok = _bind$3;
                t$2 = _ok._0;
              } else {
                return _bind$3;
              }
            }
          }
          const required = f.required ? "NOT NULL" : "";
          const primary = _M0MPC15array5Array8containsGRP38username6prisma6parser9AttributeE(f.attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr("@id")) ? "PRIMARY KEY" : "";
          const unique = _M0MPC15array5Array8containsGRP38username6prisma6parser9AttributeE(f.attributes, new _M0DTP38username6prisma6parser9Attribute10SimpleAttr("@unique")) ? "UNIQUE" : "";
          return new _M0DTPC16result6ResultGOsRPB7FailureE2Ok(`${_M0IPC16string6StringPB4Show10to__string(f.name)} ${_M0IPC16string6StringPB4Show10to__string(t$2)} ${_M0IPC16string6StringPB4Show10to__string(required)} ${_M0IPC16string6StringPB4Show10to__string(unique)} ${_M0IPC16string6StringPB4Show10to__string(primary)}`);
        });
        let _tmp$2;
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          _tmp$2 = _ok._0;
        } else {
          return _bind$2;
        }
        const _tmp$3 = _tmp$2;
        const _bind$3 = ",\n";
        const cols = _M0MPC15array5Array4joinGsE(_tmp$3, new _M0TPC16string10StringView(_bind$3, 0, _bind$3.length));
        let joint_key;
        _L$3: {
          _L$4: {
            let fs;
            _L$5: {
              _L$6: {
                const _bind$4 = _M0FP38username6prisma6parser20find__attr__by__name(attributes, "@@id");
                if (_bind$4 === undefined) {
                  joint_key = "";
                } else {
                  const _Some = _bind$4;
                  const _x = _Some;
                  if (_x.$tag === 1) {
                    const _FunctionAttr = _x;
                    const _x$2 = _FunctionAttr._0;
                    if (_x$2 === "@@id") {
                      const _x$3 = _FunctionAttr._1;
                      if (_x$3.length === 1) {
                        const _x$4 = _x$3[0];
                        const _x$5 = _x$4._0;
                        if (_x$5 === "fields") {
                          const _x$6 = _x$4._1;
                          if (_x$6.$tag === 1) {
                            const _FieldList = _x$6;
                            const _fs = _FieldList._0;
                            fs = _fs;
                            break _L$6;
                          } else {
                            break _L$4;
                          }
                        } else {
                          break _L$4;
                        }
                      } else {
                        break _L$4;
                      }
                    } else {
                      break _L$4;
                    }
                  } else {
                    break _L$4;
                  }
                }
                break _L$5;
              }
              const _bind$4 = ", ";
              const t = _M0MPC15array5Array4joinGsE(fs, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
              joint_key = `,\nPRIMARY KEY (${_M0IPC16string6StringPB4Show10to__string(t)})`;
            }
            break _L$3;
          }
          const _bind$4 = _M0FPB4failGsE("@@id should be a function call!", "src/parser/gen_code.mbt:395:16-395:55@username/prisma");
          if (_bind$4.$tag === 1) {
            const _ok = _bind$4;
            joint_key = _ok._0;
          } else {
            return _bind$4;
          }
        }
        let joint_unique;
        _L$4: {
          _L$5: {
            let fs;
            _L$6: {
              _L$7: {
                const _bind$4 = _M0FP38username6prisma6parser20find__attr__by__name(attributes, "@@unique");
                if (_bind$4 === undefined) {
                  joint_unique = "";
                } else {
                  const _Some = _bind$4;
                  const _x = _Some;
                  if (_x.$tag === 1) {
                    const _FunctionAttr = _x;
                    const _x$2 = _FunctionAttr._0;
                    if (_x$2 === "@@unique") {
                      const _x$3 = _FunctionAttr._1;
                      if (_x$3.length === 1) {
                        const _x$4 = _x$3[0];
                        const _x$5 = _x$4._0;
                        if (_x$5 === "fields") {
                          const _x$6 = _x$4._1;
                          if (_x$6.$tag === 1) {
                            const _FieldList = _x$6;
                            const _fs = _FieldList._0;
                            fs = _fs;
                            break _L$7;
                          } else {
                            break _L$5;
                          }
                        } else {
                          break _L$5;
                        }
                      } else {
                        break _L$5;
                      }
                    } else {
                      break _L$5;
                    }
                  } else {
                    break _L$5;
                  }
                }
                break _L$6;
              }
              const _bind$4 = ", ";
              const t = _M0MPC15array5Array4joinGsE(fs, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
              joint_unique = `,\n UNIQUE (${_M0IPC16string6StringPB4Show10to__string(t)})`;
            }
            break _L$4;
          }
          const _bind$4 = _M0FPB4failGsE("@@unique should be a function call!", "src/parser/gen_code.mbt:403:16-403:59@username/prisma");
          if (_bind$4.$tag === 1) {
            const _ok = _bind$4;
            joint_unique = _ok._0;
          } else {
            return _bind$4;
          }
        }
        const _tmp$4 = _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldsE(fields, (f) => {
          let attributes$2;
          _L$5: {
            const _attributes = f.attributes;
            attributes$2 = _attributes;
            break _L$5;
          }
          const rel = _M0FP38username6prisma6parser20find__attr__by__name(attributes$2, "@relation");
          _L$6: {
            let fs;
            let rs;
            _L$7: {
              if (rel === undefined) {
                return undefined;
              } else {
                const _Some = rel;
                const _x = _Some;
                if (_x.$tag === 1) {
                  const _FunctionAttr = _x;
                  const _x$2 = _FunctionAttr._0;
                  if (_x$2 === "@relation") {
                    const _x$3 = _FunctionAttr._1;
                    if (_x$3.length === 2) {
                      const _x$4 = _x$3[0];
                      const _x$5 = _x$4._0;
                      if (_x$5 === "fields") {
                        const _x$6 = _x$4._1;
                        if (_x$6.$tag === 1) {
                          const _FieldList = _x$6;
                          const _fs = _FieldList._0;
                          const _x$7 = _x$3[1];
                          const _x$8 = _x$7._0;
                          if (_x$8 === "references") {
                            const _x$9 = _x$7._1;
                            if (_x$9.$tag === 1) {
                              const _FieldList$2 = _x$9;
                              const _rs = _FieldList$2._0;
                              fs = _fs;
                              rs = _rs;
                              break _L$7;
                            } else {
                              break _L$6;
                            }
                          } else {
                            break _L$6;
                          }
                        } else {
                          break _L$6;
                        }
                      } else {
                        break _L$6;
                      }
                    } else {
                      break _L$6;
                    }
                  } else {
                    break _L$6;
                  }
                } else {
                  break _L$6;
                }
              }
            }
            const _bind$4 = ", ";
            const fs_str = _M0MPC15array5Array4joinGsE(fs, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
            const _bind$5 = ", ";
            const rs_str = _M0MPC15array5Array4joinGsE(rs, new _M0TPC16string10StringView(_bind$5, 0, _bind$5.length));
            let ref_model;
            _L$8: {
              const _bind$6 = f.type_;
              if (_bind$6.$tag === 0) {
                const _SimpleType = _bind$6;
                const _ref_model = _SimpleType._0;
                ref_model = _ref_model;
                break _L$8;
              } else {
                return $panic();
              }
            }
            return `FOREIGN KEY (${_M0IPC16string6StringPB4Show10to__string(fs_str)}) REFERENCES ${_M0IPC16string6StringPB4Show10to__string(ref_model)} (${_M0IPC16string6StringPB4Show10to__string(rs_str)})`;
          }
          return undefined;
        });
        const _bind$4 = ",\n";
        const foreign_keys = _M0MPC15array5Array4joinGsE(_tmp$4, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
        const foreign_keys$2 = foreign_keys === "" ? "" : `,\n${_M0IPC16string6StringPB4Show10to__string(foreign_keys)}`;
        init.val = `${init.val}db.exec(\`CREATE TABLE IF NOT EXISTS ${_M0IPC16string6StringPB4Show10to__string(name)}\n(${_M0IPC16string6StringPB4Show10to__string(cols)}${_M0IPC16string6StringPB4Show10to__string(joint_unique)}${_M0IPC16string6StringPB4Show10to__string(joint_key)}${_M0IPC16string6StringPB4Show10to__string(foreign_keys$2)})\`)\n`;
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(`export const init = () => {\n  ${_M0IPC16string6StringPB4Show10to__string(init.val)}\n}\n`);
}
function _M0FP38username6prisma6parser3gen(phases) {
  const ret = new _M0TPB8MutLocalGsE("");
  const _bind = phases.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const phase = phases[_];
      let name;
      let values;
      _L: {
        _L$2: {
          let name$2;
          let fields;
          _L$3: {
            _L$4: {
              switch (phase.$tag) {
                case 1: {
                  const _Model = phase;
                  const _name = _Model._0;
                  const _fields = _Model._1;
                  name$2 = _name;
                  fields = _fields;
                  break _L$4;
                }
                case 2: {
                  const _Enum = phase;
                  const _name$2 = _Enum._0;
                  const _values = _Enum._1;
                  name = _name$2;
                  values = _values;
                  break _L$2;
                }
                case 0: {
                  break;
                }
              }
              break _L$3;
            }
            const make_field_str = (f, type_str, decor) => {
              const nullable = f.required ? "" : " | null";
              return `${_M0IPC16string6StringPB4Show10to__string(f.name)}${_M0IPC16string6StringPB4Show10to__string(decor)}: ${_M0IPC16string6StringPB4Show10to__string(type_str)}${_M0IPC16string6StringPB4Show10to__string(nullable)}`;
            };
            const _bind$2 = _M0MPC15array5Array3mapGRP38username6prisma6parser5FieldsEHRPB7Failure(_M0MPC15array5Array6filterGRP38username6prisma6parser5FieldE(fields, _M0FP38username6prisma6parser15is__base__field), (f) => {
              let type_str;
              let t;
              _L$5: {
                _L$6: {
                  const _bind$3 = f.type_;
                  if (_bind$3.$tag === 0) {
                    const _SimpleType = _bind$3;
                    const _t = _SimpleType._0;
                    t = _t;
                    break _L$6;
                  } else {
                    const _bind$4 = _M0FPB4failGsE("", "src/parser/gen_code.mbt:471:30-471:38@username/prisma");
                    if (_bind$4.$tag === 1) {
                      const _ok = _bind$4;
                      type_str = _ok._0;
                    } else {
                      return _bind$4;
                    }
                  }
                  break _L$5;
                }
                switch (t) {
                  case "Int": {
                    type_str = "number";
                    break;
                  }
                  case "Float": {
                    type_str = "number";
                    break;
                  }
                  case "String": {
                    type_str = "string";
                    break;
                  }
                  case "Boolean": {
                    type_str = "boolean";
                    break;
                  }
                  default: {
                    const _bind$3 = _M0FPB4failGsE("", "src/parser/gen_code.mbt:469:24-469:32@username/prisma");
                    if (_bind$3.$tag === 1) {
                      const _ok = _bind$3;
                      type_str = _ok._0;
                    } else {
                      return _bind$3;
                    }
                  }
                }
              }
              return new _M0DTPC16result6ResultGsRPB7FailureE2Ok(make_field_str(f, type_str, ""));
            });
            let _tmp$2;
            if (_bind$2.$tag === 1) {
              const _ok = _bind$2;
              _tmp$2 = _ok._0;
            } else {
              return _bind$2;
            }
            const _tmp$3 = _tmp$2;
            const _bind$3 = ",\n";
            const base_type_str = _M0MPC15array5Array4joinGsE(_tmp$3, new _M0TPC16string10StringView(_bind$3, 0, _bind$3.length));
            const _tmp$4 = _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5FieldsE(fields, (f) => {
              if (_M0FP38username6prisma6parser15is__base__field(f)) {
                return undefined;
              } else {
                let type_str;
                let t;
                _L$5: {
                  _L$6: {
                    let t$2;
                    _L$7: {
                      const _bind$4 = f.type_;
                      if (_bind$4.$tag === 0) {
                        const _SimpleType = _bind$4;
                        const _t = _SimpleType._0;
                        t$2 = _t;
                        break _L$7;
                      } else {
                        const _ListType = _bind$4;
                        const _t = _ListType._0;
                        t = _t;
                        break _L$6;
                      }
                    }
                    type_str = `\"${_M0IPC16string6StringPB4Show10to__string(t$2)}\"`;
                    break _L$5;
                  }
                  type_str = `\"${_M0IPC16string6StringPB4Show10to__string(t)}[]\"`;
                }
                return make_field_str(f, type_str, "");
              }
            });
            const _bind$4 = ",\n";
            const rel_type_str = _M0MPC15array5Array4joinGsE(_tmp$4, new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length));
            ret.val = `${ret.val}export type ${_M0IPC16string6StringPB4Show10to__string(name$2)}Base = {\n${_M0IPC16string6StringPB4Show10to__string(base_type_str)}\n}\nexport type ${_M0IPC16string6StringPB4Show10to__string(name$2)}Rel = {\n${_M0IPC16string6StringPB4Show10to__string(rel_type_str)}\n}\nexport type ${_M0IPC16string6StringPB4Show10to__string(name$2)} = ${_M0IPC16string6StringPB4Show10to__string(name$2)}Base & ${_M0IPC16string6StringPB4Show10to__string(name$2)}Rel\n\n`;
          }
          break _L;
        }
        const _tmp$2 = _M0MPC15array5Array3mapGssE(values, (v) => `${_M0IPC16string6StringPB4Show10to__string(v)}=\"${_M0IPC16string6StringPB4Show10to__string(v)}\"`);
        const _bind$2 = ",\n";
        const v = _M0MPC15array5Array4joinGsE(_tmp$2, new _M0TPC16string10StringView(_bind$2, 0, _bind$2.length));
        ret.val = `${ret.val}enum ${_M0IPC16string6StringPB4Show10to__string(name)} {\n${_M0IPC16string6StringPB4Show10to__string(v)}\n}\n`;
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const _tmp$2 = _M0MPC15array5Array11filter__mapGRP38username6prisma6parser5PhasesE(phases, (f) => {
    let name;
    _L: {
      if (f.$tag === 1) {
        const _Model = f;
        const _name = _Model._0;
        name = _name;
        break _L;
      } else {
        return undefined;
      }
    }
    return `${_M0IPC16string6StringPB4Show10to__string(name)}Base: ${_M0IPC16string6StringPB4Show10to__string(name)}Base;\n${_M0IPC16string6StringPB4Show10to__string(name)}Rel: ${_M0IPC16string6StringPB4Show10to__string(name)}Rel;\n${_M0IPC16string6StringPB4Show10to__string(name)}: ${_M0IPC16string6StringPB4Show10to__string(name)};`;
  });
  const _bind$2 = "\n";
  const type_map_str = _M0MPC15array5Array4joinGsE(_tmp$2, new _M0TPC16string10StringView(_bind$2, 0, _bind$2.length));
  ret.val = `${ret.val}type TypeMap = {\n${_M0IPC16string6StringPB4Show10to__string(type_map_str)}\n}\n`;
  let url;
  _L: {
    const _bind$3 = _M0MPC15array5Array2atGsE(phases, 0);
    if (_bind$3.$tag === 0) {
      const _Datasource = _bind$3;
      const _url = _Datasource._2;
      url = _url;
      break _L;
    } else {
      return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok($panic());
    }
  }
  _M0MPC15array5Array6removeGsE(phases, 0);
  ret.val = `${_M0FP38username6prisma6parser7prelude}${ret.val}`;
  const _tmp$3 = ret.val;
  const _tmp$4 = _M0IPC16string6StringPB4Show10to__string(url);
  const _bind$3 = _M0FP38username6prisma6parser9gen__init(phases);
  let _tmp$5;
  if (_bind$3.$tag === 1) {
    const _ok = _bind$3;
    _tmp$5 = _ok._0;
  } else {
    return _bind$3;
  }
  ret.val = `${_tmp$3}const db = new DatabaseSync('${_tmp$4}');\n\n${_M0IPC16string6StringPB4Show10to__string(_tmp$5)}`;
  const _bind$4 = phases.length;
  let _tmp$6 = 0;
  while (true) {
    const _ = _tmp$6;
    if (_ < _bind$4) {
      const phase = phases[_];
      let name;
      let fields;
      _L$2: {
        _L$3: {
          if (phase.$tag === 1) {
            const _Model = phase;
            const _name = _Model._0;
            const _fields = _Model._1;
            name = _name;
            fields = _fields;
            break _L$3;
          }
          break _L$2;
        }
        ret.val = `${ret.val}${_M0FP38username6prisma6parser16gen__dumb__model(name, fields)}`;
      }
      _tmp$6 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const _bind$5 = phases.length;
  let _tmp$7 = 0;
  while (true) {
    const _ = _tmp$7;
    if (_ < _bind$5) {
      const phase = phases[_];
      let name;
      let fields;
      _L$2: {
        _L$3: {
          if (phase.$tag === 1) {
            const _Model = phase;
            const _name = _Model._0;
            const _fields = _Model._1;
            name = _name;
            fields = _fields;
            break _L$3;
          }
          break _L$2;
        }
        const _tmp$8 = ret.val;
        const _bind$6 = _M0FP38username6prisma6parser10gen__model(name, fields, phases);
        let _tmp$9;
        if (_bind$6.$tag === 1) {
          const _ok = _bind$6;
          _tmp$9 = _ok._0;
        } else {
          return _bind$6;
        }
        ret.val = `${_tmp$8}${_tmp$9}`;
      }
      _tmp$7 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGsRPC15error5ErrorE2Ok(ret.val);
}
(() => {
  let _try_err;
  _L: {
    const run = () => {
      const argv = _M0FP311moonbitlang1x3sys14get__cli__args();
      _M0MPC15array5Array6removeGsE(argv, 0);
      const verbose = _M0FPC13ref3newGbE(false);
      const output = _M0FPC13ref3newGsE("models.ts");
      const files = [];
      const usage = " Awesome CLI tool!\n usage: \n      mytool [options] <file1> [<file2>] ... -o <output>\n";
      const _bind = _M0FP27Yoorkin9ArgParser5parse([{ _0: "--verbose", _1: "-v", _2: new _M0DTP27Yoorkin9ArgParser4Spec3Set(verbose), _3: "enable verbose message" }, { _0: "--output", _1: "-o", _2: new _M0DTP27Yoorkin9ArgParser4Spec11Set__string(output), _3: "output file name" }], (file) => new _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(_M0MPC15array5Array4pushGsE(files, file)), usage, argv);
      if (_bind.$tag === 1) {
        const _ok = _bind;
        _ok._0;
      } else {
        return _bind;
      }
      if (files.length === 1) {
        const _bind$2 = _M0FP311moonbitlang1x2fs30read__file__to__string_2einner(_M0MPC15array5Array2atGsE(files, 0), "utf8");
        let src;
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          src = _ok._0;
        } else {
          return _bind$2;
        }
        const t = _M0MP38username6prisma6parser9Tokenizer4make(src);
        const _bind$3 = _M0FP38username6prisma6parser5parse(t);
        let phases;
        if (_bind$3.$tag === 1) {
          const _ok = _bind$3;
          phases = _ok._0;
        } else {
          return _bind$3;
        }
        _M0FPB7printlnGsE(`Parsed phases: ${_M0IP016_24default__implPB4Show10to__stringGRPB5ArrayGRP38username6prisma6parser5PhaseEE(phases)}`);
        const _tmp = output.val;
        const _bind$4 = _M0FP38username6prisma6parser3gen(phases);
        let _tmp$2;
        if (_bind$4.$tag === 1) {
          const _ok = _bind$4;
          _tmp$2 = _ok._0;
        } else {
          return _bind$4;
        }
        return _M0FP311moonbitlang1x2fs31write__string__to__file_2einner(_tmp, _tmp$2, "utf8");
      } else {
        _M0FPB7printlnGsE(usage);
        return _M0FPB4failGuE("Must specify *1* input file!", "src/main/main.mbt:25:7-25:43@username/prisma");
      }
    };
    let _bind;
    let _try_err$2;
    _L$2: {
      _L$3: {
        const _bind$2 = run();
        if (_bind$2.$tag === 1) {
          const _ok = _bind$2;
          _ok._0;
        } else {
          const _err = _bind$2;
          _try_err$2 = _err._0;
          break _L$3;
        }
        _bind = new _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(undefined);
        break _L$2;
      }
      const err = _try_err$2;
      _bind = new _M0DTPC16result6ResultGuRPC15error5ErrorE2Ok(_M0FPB7printlnGsE(`Error: ${_M0IP016_24default__implPB4Show10to__stringGRPC15error5ErrorE(err)}`));
    }
    if (_bind.$tag === 1) {
      const _ok = _bind;
      _ok._0;
      return;
    } else {
      const _err = _bind;
      _try_err = _err._0;
      break _L;
    }
  }
  const err = _try_err;
  _M0FPB5abortGuE(_M0IP016_24default__implPB4Show10to__stringGRPC15error5ErrorE(err), "src/main/main.mbt:2:1-38:2@username/prisma");
})();
//# sourceMappingURL=main.js.map
