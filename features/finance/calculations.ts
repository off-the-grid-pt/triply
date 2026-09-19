import type { ActualExpense, Adjustment, CostItem, FinanceTotals, Payment } from "./types";

const minor=(value:string|null)=>value===null?0n:BigInt(value);

export function calculateFinanceTotals(costs:CostItem[],payments:Payment[],actuals:ActualExpense[],adjustments:Adjustment[]):FinanceTotals{
  const active=costs.filter((cost)=>cost.archivedAt===null);
  const estimated=active.reduce((sum,cost)=>sum+minor(cost.estimatedBaseMinor),0n);
  const committed=active.reduce((sum,cost)=>sum+minor(cost.committedBaseMinor),0n);
  const forecast=active.reduce((sum,cost)=>sum+minor(cost.committedBaseMinor??cost.estimatedBaseMinor),0n);
  const paymentAdjustments=new Set(payments.map((item)=>item.id));
  const actualAdjustments=new Set(actuals.map((item)=>item.id));
  const paid=payments.reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n)+adjustments.filter((item)=>item.paymentId&&paymentAdjustments.has(item.paymentId)).reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n);
  const actual=actuals.reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n)+adjustments.filter((item)=>item.actualExpenseId&&actualAdjustments.has(item.actualExpenseId)).reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n);
  const standaloneIds=new Set(actuals.filter((item)=>item.costItemId===null).map((item)=>item.id));
  const unplannedActual=actuals.filter((item)=>item.costItemId===null).reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n)+adjustments.filter((item)=>item.actualExpenseId&&standaloneIds.has(item.actualExpenseId)).reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n);
  return{estimated,committed,forecast,paid,actual,unplannedActual};
}

export function remaining(target:string|null,value:bigint):bigint|null{return target===null?null:BigInt(target)-value;}
export function variance(baseline:string|null,actual:string|null):bigint|null{return baseline===null||actual===null?null:BigInt(baseline)-BigInt(actual);}

export function decimalRatio(baseMinor:bigint,originalMinor:bigint,baseDigits=0,originalDigits=0):string{
  if(originalMinor===0n)return "1";
  const scale=1_000_000_000_000n;
  const numerator=baseMinor*10n**BigInt(originalDigits),denominator=originalMinor*10n**BigInt(baseDigits);
  const scaled=(numerator*scale+denominator/2n)/denominator;
  const whole=scaled/scale, fraction=(scaled%scale).toString().padStart(12,"0").replace(/0+$/,"");
  return fraction?`${whole}.${fraction}`:whole.toString();
}

export type FinanceBreakdown={forecast:bigint;actual:bigint};
export function calculateBreakdown(costs:CostItem[],actuals:ActualExpense[],adjustments:Adjustment[],key:"categoryId"|"stopId"):Map<string,FinanceBreakdown>{
  const result=new Map<string,FinanceBreakdown>();
  const add=(id:string|null,field:keyof FinanceBreakdown,amount:bigint)=>{if(!id)return;const current=result.get(id)??{forecast:0n,actual:0n};result.set(id,{...current,[field]:current[field]+amount});};
  costs.filter(item=>!item.archivedAt).forEach(item=>add(item[key],"forecast",minor(item.committedBaseMinor??item.estimatedBaseMinor)));
  actuals.forEach(item=>add(item[key],"actual",BigInt(item.baseAmountMinor)));
  const byId=new Map(actuals.map(item=>[item.id,item]));adjustments.forEach(item=>{const actual=item.actualExpenseId?byId.get(item.actualExpenseId):undefined;if(actual)add(actual[key],"actual",BigInt(item.baseAmountMinor));});
  return result;
}

export function overpaidCostIds(costs:CostItem[],payments:Payment[],adjustments:Adjustment[]):string[]{
  return costs.filter(cost=>cost.committedBaseMinor!==null).filter(cost=>{
    const ids=new Set(payments.filter(payment=>payment.costItemId===cost.id).map(payment=>payment.id));
    const paid=payments.filter(payment=>ids.has(payment.id)).reduce((sum,payment)=>sum+BigInt(payment.baseAmountMinor),0n)+adjustments.filter(item=>item.paymentId&&ids.has(item.paymentId)).reduce((sum,item)=>sum+BigInt(item.baseAmountMinor),0n);
    return paid>BigInt(cost.committedBaseMinor!);
  }).map(cost=>cost.id);
}
