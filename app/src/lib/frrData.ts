function t(mm: number, ss: number): number { return mm * 60 + ss; }
function tH(h: number, mm: number, ss: number): number { return h * 3600 + mm * 60 + ss; }
function tHMM(h: number, mm: number, ss: number): number { return tH(h, mm, ss); }

export interface FRRRow {
  fiveK: number;    // seconds
  k10: number;      // seconds
  k15: number;      // seconds
  half: number;     // seconds
  ltLo: string;     // "mm:ss" per mile
  ltHi: string;     // "mm:ss" per mile
  lrEarly: string;  // "mm:ss" per mile
  lrLatter: string; // "mm:ss" per mile
  v400f: number;    // seconds for 400m (fast)
  v400s: number;    // seconds for 400m (slow)
  s300f: number;    // seconds for 300m (fast)
  s300s: number;    // seconds for 300m (slow)
  s200f: number;    // seconds for 200m (fast)
  s200s: number;    // seconds for 200m (slow)
}

export const FRR_ROWS: FRRRow[] = [
  {fiveK:t(14,0), k10:t(29,7), k15:t(44,42), half:tH(1,4,39), ltLo:"4:40", ltHi:"4:50", lrEarly:"6:14", lrLatter:"5:37", v400f:65,  v400s:67,  s300f:44, s300s:47, s200f:29, s200s:31},
  {fiveK:t(14,30), k10:t(30,10), k15:t(46,18), half:tH(1,6,57), ltLo:"4:50", ltHi:"5:0", lrEarly:"6:27", lrLatter:"5:49", v400f:67,  v400s:70,  s300f:45, s300s:48, s200f:30, s200s:32},
  {fiveK:t(15,0), k10:t(31,12), k15:t(47,54), half:tH(1,9,16), ltLo:"5:0", ltHi:"5:10", lrEarly:"6:41", lrLatter:"6:2", v400f:69,  v400s:72,  s300f:47, s300s:50, s200f:31, s200s:33},
  {fiveK:t(15,30), k10:t(32,14), k15:t(49,29), half:tH(1,11,34), ltLo:"5:11", ltHi:"5:21", lrEarly:"6:54", lrLatter:"6:14", v400f:72,  v400s:74,  s300f:48, s300s:52, s200f:32, s200s:35},
  {fiveK:t(16,0), k10:t(33,17), k15:t(51,5), half:tH(1,13,53), ltLo:"5:20", ltHi:"5:30", lrEarly:"7:7", lrLatter:"6:26", v400f:74,  v400s:77,  s300f:50, s300s:54, s200f:33, s200s:36},
  {fiveK:t(16,30), k10:t(34,19), k15:t(52,41), half:tH(1,16,11), ltLo:"5:30", ltHi:"5:40", lrEarly:"7:21", lrLatter:"6:38", v400f:76,  v400s:79,  s300f:51, s300s:55, s200f:34, s200s:37},
  {fiveK:t(17,0), k10:t(35,22), k15:t(54,17), half:tH(1,18,30), ltLo:"5:40", ltHi:"5:50", lrEarly:"7:34", lrLatter:"6:50", v400f:78,  v400s:82,  s300f:53, s300s:57, s200f:35, s200s:38},
  {fiveK:t(17,30), k10:t(36,24), k15:t(55,52), half:tH(1,20,48), ltLo:"5:51", ltHi:"6:1", lrEarly:"7:47", lrLatter:"7:2", v400f:81,  v400s:84,  s300f:54, s300s:59, s200f:36, s200s:39},
  {fiveK:t(18,0), k10:t(37,26), k15:t(57,28), half:tH(1,23,7), ltLo:"6:0", ltHi:"6:10", lrEarly:"8:1", lrLatter:"7:14", v400f:83,  v400s:86,  s300f:56, s300s:60, s200f:37, s200s:40},
  {fiveK:t(18,30), k10:t(38,29), k15:t(59,4), half:tH(1,25,26), ltLo:"6:10", ltHi:"6:20", lrEarly:"8:14", lrLatter:"7:26", v400f:85,  v400s:89,  s300f:58, s300s:62, s200f:38, s200s:41},
  {fiveK:t(19,0), k10:t(39,31), k15:tHMM(1,0,40), half:tH(1,27,44), ltLo:"6:21", ltHi:"6:31", lrEarly:"8:28", lrLatter:"7:38", v400f:88,  v400s:91,  s300f:59, s300s:64, s200f:39, s200s:42},
  {fiveK:t(19,30), k10:t(40,34), k15:tHMM(1,2,16), half:tH(1,30,3), ltLo:"6:31", ltHi:"6:41", lrEarly:"8:41", lrLatter:"7:50", v400f:90,  v400s:94,  s300f:61, s300s:65, s200f:40, s200s:43},
  {fiveK:t(20,0), k10:t(41,36), k15:tHMM(1,3,51), half:tH(1,32,21), ltLo:"6:41", ltHi:"6:51", lrEarly:"8:54", lrLatter:"8:2", v400f:92,  v400s:96,  s300f:62, s300s:67, s200f:41, s200s:45},
  {fiveK:t(20,30), k10:t(42,38), k15:tHMM(1,5,27), half:tH(1,34,40), ltLo:"6:51", ltHi:"7:1", lrEarly:"9:8", lrLatter:"8:14", v400f:95,  v400s:98,  s300f:64, s300s:69, s200f:43, s200s:46},
  {fiveK:t(21,0), k10:t(43,41), k15:tHMM(1,7,3), half:tH(1,36,58), ltLo:"7:2", ltHi:"7:12", lrEarly:"9:21", lrLatter:"8:26", v400f:97,  v400s:101, s300f:65, s300s:70, s200f:44, s200s:47},
  {fiveK:t(21,30), k10:t(44,43), k15:tHMM(1,8,39), half:tH(1,39,17), ltLo:"7:12", ltHi:"7:22", lrEarly:"9:34", lrLatter:"8:38", v400f:99,  v400s:103, s300f:67, s300s:72, s200f:45, s200s:48},
  {fiveK:t(22,0), k10:t(45,46), k15:tHMM(1,10,14), half:tH(1,41,35), ltLo:"7:22", ltHi:"7:32", lrEarly:"9:48", lrLatter:"8:50", v400f:101, v400s:106, s300f:68, s300s:74, s200f:46, s200s:49},
  {fiveK:t(22,30), k10:t(46,48), k15:tHMM(1,11,50), half:tH(1,43,54), ltLo:"7:32", ltHi:"7:42", lrEarly:"10:1", lrLatter:"9:2", v400f:104, v400s:108, s300f:70, s300s:75, s200f:47, s200s:50},
  {fiveK:t(23,0), k10:t(47,50), k15:tHMM(1,13,26), half:tH(1,46,12), ltLo:"7:43", ltHi:"7:53", lrEarly:"10:14", lrLatter:"9:14", v400f:106, v400s:110, s300f:72, s300s:77, s200f:48, s200s:51},
  {fiveK:t(23,30), k10:t(48,53), k15:tHMM(1,15,2), half:tH(1,48,31), ltLo:"7:53", ltHi:"8:3", lrEarly:"10:28", lrLatter:"9:26", v400f:108, v400s:113, s300f:73, s300s:79, s200f:49, s200s:52},
  {fiveK:t(24,0), k10:t(49,55), k15:tHMM(1,16,38), half:tH(1,50,49), ltLo:"8:3", ltHi:"8:13", lrEarly:"10:41", lrLatter:"9:38", v400f:110, v400s:115, s300f:75, s300s:80, s200f:50, s200s:54},
  {fiveK:t(24,30), k10:t(50,58), k15:tHMM(1,18,13), half:tH(1,53,8), ltLo:"8:14", ltHi:"8:24", lrEarly:"10:54", lrLatter:"9:50", v400f:112, v400s:117, s300f:76, s300s:82, s200f:51, s200s:55},
  {fiveK:t(25,0), k10:t(52,0), k15:tHMM(1,19,49), half:tH(1,55,26), ltLo:"8:24", ltHi:"8:34", lrEarly:"11:8", lrLatter:"10:3", v400f:115, v400s:120, s300f:78, s300s:84, s200f:52, s200s:56},
  {fiveK:t(26,0), k10:t(54,5), k15:tHMM(1,23,1), half:tH(2,0,33), ltLo:"8:44", ltHi:"8:54", lrEarly:"11:35", lrLatter:"10:27", v400f:120, v400s:125, s300f:81, s300s:87, s200f:54, s200s:58},
  {fiveK:t(27,0), k10:t(56,10), k15:tHMM(1,26,12), half:tH(2,4,41), ltLo:"9:5", ltHi:"9:15", lrEarly:"12:1", lrLatter:"10:51", v400f:125, v400s:130, s300f:84, s300s:90, s200f:56, s200s:60},
  {fiveK:t(28,0), k10:t(58,14), k15:tHMM(1,29,24), half:tH(2,9,18), ltLo:"9:25", ltHi:"9:35", lrEarly:"12:28", lrLatter:"11:15", v400f:129, v400s:134, s300f:87, s300s:94, s200f:58, s200s:62},
  {fiveK:t(29,0), k10:tHMM(1,0,19), k15:tHMM(1,32,35), half:tH(2,13,55), ltLo:"9:46", ltHi:"9:56", lrEarly:"12:55", lrLatter:"11:39", v400f:134, v400s:139, s300f:90, s300s:97, s200f:60, s200s:65},
  {fiveK:t(30,0), k10:tHMM(1,2,24), k15:tHMM(1,35,47), half:tH(2,18,32), ltLo:"10:7", ltHi:"10:17", lrEarly:"13:21", lrLatter:"12:3", v400f:138, v400s:144, s300f:93, s300s:100, s200f:62, s200s:67}
];
