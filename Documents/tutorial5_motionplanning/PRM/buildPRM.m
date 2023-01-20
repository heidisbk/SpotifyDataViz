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
## @deftypefn {} {@var{retval} =} buildPRM (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

function [points, connectionMatrix]= buildPRM ()

  
addpath("C:/motion_planning");

clc
  close all
   
  randV = 360;
  L1 = 2; 
  L2 = 1;
  points = []; #Creation of empty matrices for storing
  cMatrix = [];
  connectionMatrix = [];
   #points' coordinate and the one of onstacle
  gap = 0.2; #Interval between sampled pointns on the line
  
   
  %DH Parameters
  d = [0; 0];
  a = [L1; L2];
  alpha = [0; 0];
  jointNumber = 1;
  %End effector position
  Bmatrix = [0; 0; 0; 1];
  
  

  n=1;
  nPts = 10; #Number of points we want
 while n<=nPts
    
    q1 = randi(randV); 
    q2 = randi(randV);
    
    theta = [q1; q2];
    jTee = dh2ForwardKinematics(theta, d, a, alpha, jointNumber);
    b_P_ee = jTee*Bmatrix;
    %Is the end effector colliding with connectionMatrix
    x=b_P_ee(1);
    y=b_P_ee(2);

    if(y >= L1 || y <= -L1 || (-L2<=x && x<=L2 && -L2<=y && y<=L2))
      disp('You are in a prohibited area');
    else
      %Store q1 q2 values
       n++;
       points = [points [q1;q2;x;y]];
      
      [connectionMatrixC] = interCartesian (n, L2, gap, points, x, y)
      [connectionMatrixJ] = interJoint (n, L1, L2, gap, points, q1, q2, d, a, alpha, jointNumber, Bmatrix) 
     
      hold on
      
      
    endif
  endwhile
  
  [q_S, q_G] = planPathPRM (n, L2, gap, points, x, y);
 # connectionMatrixJ
  # connectionMatrixC

endfunction
