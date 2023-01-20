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
## @deftypefn {} {@var{retval} =} interJoint (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

##function [connectionMatrixJ] = interCartesian (n, L2, gap, points, q1, q2, d, a, alpha, jointNumber, Bmatrix)  
##
## Task: Implement a code that check intersections with obstacle using the original position of 
##      the end effector in the joint-space
##
## Inputs: n 
##	        L2, joint value
##          gap, interval of sampling
##          points, matrix containing joint and cartesian values
##            q1 joint value
##            q2 joint value
##            d prismatic matrix in z
##            a prismatic matrix in x
##            alpha joint matrix in x
##            jointNumber = number of joints
##            Bmatrix
##
## Outputs: connectionMatrixC
##	

function [connectionMatrixJ] = interJoint (n, L1, L2, gap, points, q1, q2, d, a, alpha, jointNumber, Bmatrix)  

gap = 0.2;
      connectionMatrixJ = [];
      hold on
       figure(2)
   axis ([0 400 0 400]);
      %getting y=ax+b values
      for j=1:columns(points)-1
        q1_stored = points(1,j);
        q2_stored = points(2,j);
         
        if q1_stored != q1
          
          A = (q2_stored- q2)/(q1_stored - q1);
          B = q2 - A * q1;
          
          Q2 = @(Q1) A*Q1+B;
          
          %getting the sampling direction
          if q1 > q1_stored
            gap = gap;
          else
            gap = -gap;
          endif
          
          connectionMatrixJ(j,n) = 0;
          connectionMatrixJ(n,j) = 0;
          
          %getting the sample points
          for g=q1_stored:gap:q1
            Q1test = g;
            Q2test = Q2(g);
            
            
            theta = [Q1test; Q2test];
            jTee = dh2ForwardKinematics(theta, d, a, alpha, jointNumber);
            b_P_ee = jTee*Bmatrix;
            %Is the end effector colliding with obstacle
            Xtest = b_P_ee(1);
            Ytest = b_P_ee(2);
            
            %filling the obstacle matrix
            if(Ytest >= L1 || Ytest <= -L1 || (-L2<=Xtest && Xtest<=L2 && -L2<=Ytest && Ytest<=L2)) %verifie les obstacles
              connectionMatrixJ(j,n) = 1;
              connectionMatrixJ(n,j) = 1;
            endif
            

          endfor
          if connectionMatrixJ(j, n) == 0 && n != j
           
            
            
         
            Xplot = [q1, q1_stored];
            Yplot = [q2, q2_stored];
            title ("Points in Joint-Space");
            plot(Xplot, Yplot, 'o-r', 'Color', 'b');
            drawnow
            
          endif
          
    endif
    
  endfor
  
endfunction
