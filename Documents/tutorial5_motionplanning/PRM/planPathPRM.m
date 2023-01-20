## Copyright (C) 2023 borie
## 
## This program is free software: you can redistribute it and/or modify it
## under the terms of the GNU General Public License as published by
## the Free Software Foundation, either version 3 of the License, or
## (at your option) any later version.
## 
## This program is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.
## 
## You should have received a copy of the GNU General Public License
## along with this program.  If not, see
## <https://www.gnu.org/licenses/>.

## -*- texinfo -*- 
## @deftypefn {} {@var{retval} =} planPathPRM (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

##function [q_S, q_G] = planPathPRM (n, L2, gap, points, x, y)
##
## Task: Implement a code that creates a map and the finds a path between
##       a given start point and a goal point (in C-space) while avoiding collisions
##
## Inputs: n 
##	        L2, joint value
##          gap, interval of sampling
##          points, matrix containing joint and cartesian values
##          x  position of end effector in x-axis
##          y  position of end effector in y-axis
##
## Outputs: JTee 
##	
##	
##


function [q_S, q_G] = planPathPRM (n, L2, gap, points, x, y)

 qi_S = [];
  q1_S = [];
  q2_S = [];
  
  qi_G = [];
  q1_G = [];
  q2_G = [];
  
  
  L1 =2;
  L2 = 1;
  S = [2;0]; #Starting point
  G = [-2;0]; #Goal location

##  #Filling x and y component of S and G in a XY Matrix
  newPoints_xy = [];
  newPoints_xy = [points(3,:); points(4,:)];
  newPoints_xy = [S newPoints_xy G];
   
   #Start Pt - Inverse Kinematic for havig join values
  [nbSol, qi_S] = solveIK2LinkPlanarRobot(L1, L2, S(1,1), S(2,1));
  q1_S = [q1_S qi_S(1,2) ]; #qi_S(1,2)];  #We only decided to deal with one of the solution
  q2_S = [q2_S qi_S(2,2)];# qi_S(2,2)];
  q_S = [q1_S;q2_S];
  
     #Goal Pt - Inverse Kinematic for havig join values
  [nbSol, qi_G] = solveIK2LinkPlanarRobot(L1, L2, G(1,1), G(2,1));
  q1_G = [q1_G qi_G(1,1)];# qi_G(1,2)];  
  q2_G = [q2_G qi_G(2,1)];# qi_G(2,2)];
  q_G = [q1_G;q2_G];

## Plotting point S and G
figure(1)
 text(S(1,1),S(2,1), "  S",'Fontsize',15);
 plot(S(1,1),S(2,1),'o-r');
 
 text(G(1,1),G(2,1), "  G",'Fontsize',15);
 plot(G(1,1),G(2,1),'o-r');

 figure(2)
 text(q_S(1,1),q_S(2,1), "  S",'Fontsize',15);
 plot(q_S(1,1),q_S(2,1),'o-r');
 
 text(q_G(1,1),q_G(2,1), "  G",'Fontsize',15);
 plot(q_G(1,1),q_G(2,1),'o-r');
 
## Obtaining connection matrices
[connectionMatrixC] = interCartesian (n, L2, gap, points, x, y);
 dx_S = [];
 dx_G = [];
 dx_qS = [];
 dx_qG = [];
 ##S and G in C plot
[index1] = indexSplanPRM (S, dx_S, points);
[connectionMatrixS] = interStart (n, L2, gap, points, x, y, S,index1, connectionMatrixC)


[index2] = indexGplanPRM (G, dx_G, points);
[connectionMatrixSG] = interGoal (n, L2, gap, points, x, y, G,index2, connectionMatrixC, connectionMatrixS)


endfunction
