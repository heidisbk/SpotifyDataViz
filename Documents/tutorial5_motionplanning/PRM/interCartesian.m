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
## @deftypefn {} {@var{retval} =} interCartesian (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

##function [connectionMatrixC] = interCartesian (n, L2, gap, points, x, y)
##
## Task: Implement a code that check intersections with obstacle using the original position of 
##      the end effector in the C-space
##
## Inputs:  n 
##	        L2, joint value
##          gap, interval of sampling
##          points, matrix containing joint and cartesian values
##          x  position of end effector in x-axis
##          y  position of end effector in y-axis
##
## Outputs: connectionMatrixC
##	

function [connectionMatrixC] = interCartesian (n, L2, gap, points, x, y)

connectionMatrixC = zeros(10,10);
   xplot = [];
   yplot = [];
   gap = 0.001;
   hold on
   figure(1)
   axis ([-4 4 -4 4]);
   
   title ("Points and Obstacles in C-Space");
   h = rectangle('Position', [-L2, -L2, 2*L2, 2*L2]); #Square
   b = rectangle('Position', [-500*L2, -4*L2, 1000*L2, 2*L2]); ;#Lower boundary
   c = rectangle('Position', [500*L2, 4*L2, -1000*L2, -2*L2]); #Upper boundary
  
   set (h, "FaceColor", [1, 1, 1]);
   set (b, "FaceColor", [1, 1, 0]);
   set (c, "FaceColor", [1, 1, 0]);
   
   for j=1:columns(points)-1 
      
       x_stored = points(3,j)
       y_stored = points(4,j)
##       texte = int2str(columns(points));    #Transform integer to string
##       text(x, y, texte, 'FontSize', 23); #Display the points by apperance 
        
        if x_stored != x 
          A = (y_stored - y)/(x_stored - x);
          B = y - A *x;
          Y = @(X) A*X+B;
          if( abs(x_stored-x)<gap && x_stored>-L2 && x_stored<L2)
             bool = 1;
             connectionMatrixC (j,n) = 1;
             connectionMatrixC (n,j) = 1;
              break;
              elseif (x_stored > x)
       
               for(g = x:gap:x_stored)
                 if(-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
        connectionMatrixC (j,n) = 1;
        connectionMatrixC (n,j) = 1;
                  break;
                 else
                  bool = 0;
                  connectionMatrixC (j,n) = 0;
        connectionMatrixC (n,j) = 0;
                endif
              endfor
      
            elseif (x_stored < x)
        
              for (g = x_stored:gap:x)
                if (-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
                  connectionMatrixC (j,n) = 1;
        connectionMatrixC (n,j) = 1;
                  break;
                  else
                  bool = 0;
                  connectionMatrixC (j,n) = 0;
        connectionMatrixC (n,j) = 0;
              endif
            
             endfor
      endif
     
    if bool == 0 &&  connectionMatrixC(j, n) == 0 && n!=j
     
       
              xplot = [x, x_stored];
              yplot = [y, y_stored];
              xyplot = [xplot; yplot];
              plot(xplot, yplot, 'o-r', 'Color', 'b');
              drawnow
            
    endif
         
       endif
      endfor  
      
endfunction
