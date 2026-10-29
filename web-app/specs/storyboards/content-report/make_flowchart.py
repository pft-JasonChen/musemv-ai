#!/usr/bin/env python3
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[2]/'skills/yco-spec'))
from flowchart_lib import Flow
f=Flow('Content Report','Approved Web behavior',version='v1',date='2026-10-29',width=1280,height=1590)
rows=[
 ('P1 Report', [('Report entry','P1-S1'),('Reason or Details','P1-S2 / P1-S3'),('Success and Done','P1-S4')]),
 ('P2 Guard feedback',[('Already reported','P2-S1'),('Five successes reached','P2-S2')]),
 ('P3 Recovery',[('Submission fails','P3-S1'),('Keep draft and retry','P3-S2')]),
 ('P4 Ownership',[('Signed-in owner','P4-S1'),('Report hidden and blocked','P4-S1')]),
 ('P5 Removal',[('Public unavailable','P5-S1'),('Owner private playback','P5-S2'),('History notice and detail','P5-S3 / P5-S4')]),
 ('P6 Phone',[('Bottom sheet','P6-S1'),('Details','P6-S2'),('Success and Done','P6-S3')]),
]
for i,(title,nodes) in enumerate(rows):
 y=75+i*220;f.section(y,title);previous=None
 for j,(title,sub) in enumerate(nodes):
  node=f.node(40+j*400,y+45,title,sub,w=330)
  if previous:f.edge(previous,node,side='h')
  previous=node
f.legend(1450)
f.write(str(HERE/'user-flowchart.svg'))
