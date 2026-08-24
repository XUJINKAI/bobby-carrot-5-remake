const COMPLETED_KEY='bobby.explore.completedLevels';
const LAST_LEVEL_KEY='bobby.explore.lastLevel';

export function completedExploreLevels():Set<string>{try{const value=JSON.parse(localStorage.getItem(COMPLETED_KEY)??'[]');return new Set(Array.isArray(value)?value.map(String):[]);}catch{return new Set();}}
export function markExploreLevelCompleted(canonicalId:string):void{const completed=completedExploreLevels();completed.add(canonicalId);localStorage.setItem(COMPLETED_KEY,JSON.stringify([...completed].sort()));}
export function lastExploreLevelId():string|null{return localStorage.getItem(LAST_LEVEL_KEY);}
export function rememberExploreLevel(publicId:string):void{localStorage.setItem(LAST_LEVEL_KEY,publicId);}
