const fs=require("fs");const D=__dirname;
const R=JSON.parse(fs.readFileSync(D+"/pixels.json","utf8"));
const litCount=k=>R[k].px.filter(p=>p[2]===1).length;
const names=Object.keys(R);
console.log("case                 litPx");
for(const k of names) console.log(k.padEnd(20), litCount(k));
// whole-picture pool test
const L1c=litCount("fill1.000-closed"), L1o=litCount("fill1.000-open");
const rows=[["fill0.200-closed",0.2,L1c],["fill0.500-closed",0.5,L1c],["fill0.900-closed",0.9,L1c],
            ["fill0.500-open",0.5,L1o],["fill0.900-open",0.9,L1o]];
console.log("\nAGGREGATE lit area / lit area at fill 1.0  (should equal fill)");
for(const [k,f,den] of rows) console.log(k.padEnd(20), "fill",f, "measured", (litCount(k)/den).toFixed(3));
// bowl deck isolated by open-minus-closed
const bowlDen=L1o-L1c;
const bowl09=litCount("fill0.900-open")-litCount("fill0.900-shut");
const bowl05=litCount("fill0.500-open")-litCount("fill0.500-closed");
const lower_club09=litCount("fill0.900-shut"), lower_club05=litCount("fill0.500-closed");
console.log("\nBOWL DECK isolated (open minus bowl-shut, same fill):");
console.log(" bowl deck total lit area at fill1.0 =",bowlDen,"=",(bowlDen/L1o*100).toFixed(1),"% of the drawn lit seat area with the bowl open");
console.log(" bowl lit fraction @0.5 =",(bowl05/bowlDen).toFixed(3)," @0.9 =",(bowl09/bowlDen).toFixed(3));
console.log(" lower+club lit fraction @0.5 =",(lower_club05/L1c).toFixed(3)," @0.9 =",(lower_club09/L1c).toFixed(3));
