# -*- coding: utf-8 -*-
"""
Created on Tue Aug 20 09:22:55 2013

@author: matt
"""

from __future__ import division, print_function

import itertools
from scipy import stats
#print list(itertools.permutations([1,2,3], 3))
from collections import Counter
#cnt = Counter("abracadabra")

all_permutations = list(itertools.permutations(range(1,9)))

if 0:    
    print(stats.scoreatpercentile(all_permutations[0], 25))
    print(stats.scoreatpercentile(all_permutations[0], 50))
    print(stats.scoreatpercentile(all_permutations[0], 75))

    print(stats.scoreatpercentile(all_permutations[22], 25))
    print(stats.scoreatpercentile(all_permutations[22], 50))
    print(stats.scoreatpercentile(all_permutations[22], 75))

        
def my_average(l):
    if len(l) > 1:
        newL = []
        for i in range(0, len(l), 2):
            newL.append((l[i] + l[i+1])/2)
        #print(newL)
        return my_average(newL)
    else:
        return l[0];
        
def average(l):
    return sum(l)/len(l)
    
def smallest_two(a,b,c,d):
    l = [a,b,c,d]
    l = sorted(l)
    return l[0:2]
    
def largest_two(a,b,c,d):
    l = [a,b,c,d]
    l = sorted(l, reverse=True)
    return l[0:2]
    
def avg_sml_two(a,b,c,d):
    return average(smallest_two(a,b,c,d))
    
def avg_lrg_two(a,b,c,d):
    return average(largest_two(a,b,c,d))

#q1(all_permutations[0])

print(average(all_permutations[0]))
print(my_average(all_permutations[0]))
print()

def my_qs(q1, q3=[]):
    if len(q1) > 1:
        newq1 = []
        newq3 = []
        for i in range(0, len(q1), 2):
            if len(q3) > 1:
                newq1.append(avg_sml_two(q1[i], q1[i+1], q3[i], q3[i+1]))
                newq3.append(avg_lrg_two(q1[i], q1[i+1], q3[i], q3[i+1]))
            else:
                newq1.append(average([q1[i], q1[i+1]]))
                newq3.append(average([q1[i], q1[i+1]]))
        return my_qs(newq1, newq3)
    else:
        return q1[0], q3[0]

print(all_permutations[0])
print(stats.scoreatpercentile(all_permutations[0], 25))
print(stats.scoreatpercentile(all_permutations[0], 75))
print(my_qs(all_permutations[0]))
print()
print(all_permutations[8])
#print(stats.scoreatpercentile(all_permutations[8], 25))
#print(stats.scoreatpercentile(all_permutations[8], 75))
print(my_qs(all_permutations[8]))
print()
print(all_permutations[13])
#print(stats.scoreatpercentile(all_permutations[13], 25))
#print(stats.scoreatpercentile(all_permutations[13], 75))
print(my_qs(all_permutations[13]))
print()
print(all_permutations[23])
#print(stats.scoreatpercentile(all_permutations[23], 25))
#print(stats.scoreatpercentile(all_permutations[23], 75))
print(my_qs(all_permutations[23]))
print()
w = 45
print(all_permutations[w])
#print(stats.scoreatpercentile(all_permutations[w], 25))
#print(stats.scoreatpercentile(all_permutations[w], 75))
print(my_qs(all_permutations[w]))
print()
w=89
print(all_permutations[w])
print(my_qs(all_permutations[w]))
print()
w=40319
print(all_permutations[w])
print(my_qs(all_permutations[w]))
print()
print(len(all_permutations))

totalq1 = []
totalq3 = []
for i in range(len(all_permutations)):
    totalq1.append(my_qs(all_permutations[i])[0])
    totalq3.append(my_qs(all_permutations[i])[1])
#print(total)
cnt = Counter(totalq1)
print(cnt)
print("real value of q1", stats.scoreatpercentile(all_permutations[0], 25))
cnt = Counter(totalq3)
print(cnt)
print("real value of q3", stats.scoreatpercentile(all_permutations[0], 75))