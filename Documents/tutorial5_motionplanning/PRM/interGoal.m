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
## @deftypefn {} {@var{retval} =} interGoal (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

##function [connectionMatrixSG] = interCartesian (n, L2, gap, points, x, y, G, index2, connectionMatrixC, connectionMatrixS)
##
## Task: Implement a code that check intersections with obstacle for the ending point of
##      the end effector in the C-space and fill a big matrix with 
##        the result obtain for point x, y and S
##
## Inputs: n 
##	        L2, joint value
##          gap, interval of sampling
##          points, matrix containing joint and cartesian values
##          x  position of end effector in x-axis
##          y  position of end effector in y-axis
##          G ending point (-2,0)
##          index 2 of minimal value in the array computing the distance between S and other points
##
## Outputs: connectionMatrixS
##	

function [connectionMatrixSG] = interGoal (n, L2, gap, points, x, y, G,index2, connectionMatrixC, connectionMatrixS)

 hold on
   connectionMatrixG = zeros(11,1);
   connectionMatrixSG = [zeros(12,12)];
   xplot_G = [];
   yplot_G = [];
   gap = 0.0001;

  
      for j = index2
       x_stored = points(3,j);
       y_stored = points(4,j);
##       texte = int2str(columns(points));    #Transform integer to string
##       text(x, y, texte, 'FontSize', 23); #Display the points by apperance 
        
        if (x_stored != G(1,1)) 
           
          A = (y_stored - G(2,1))/(x_stored - G(1,1));
          B = G(2,1) - A *G(1,1);
          Y = @(X) A*X+B;
          if( abs(x_stored-G(1,1))<gap && x_stored>-L2 && x_stored<L2)
             bool = 1;
             connectionMatrixG (j,n) = 1;
             connectionMatrixG (n,j) = 1;
              break;
              elseif (x_stored > G(1,1))
       
               for(g = G(1,1):gap:x_stored)
                 if(-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
        connectionMatrixG (j,n) = 1;
        connectionMatrixG (n,j) = 1;
                  break;
                 else
                  bool = 0;
                  connectionMatrixG (j,n) = 0;
        connectionMatrixG (n,j) = 0;
                endif
              endfor
      
            elseif (x_stored < G(1,1))
        
              for (g = x_stored:gap:x)
                if (-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
                  connectionMatrixG (j,n) = 1;
        connectionMatrixG (n,j) = 1;
                  break;
                  else
                  bool = 0;
                  connectionMatrixG (j,n) = 0;
        connectionMatrixG (n,j) = 0;
              endif
             endfor
      endif
          if bool == 0 &&  connectionMatrixG(j, n) == 0 && n!=j 
           
           
              xplot = [G(1,1), x_stored];
              yplot = [G(2,1), y_stored];
              xyplot = [xplot; yplot];
              plot(xplot, yplot, 'o-r', 'Color', 'r');
              drawnow
         endif
       endif
      
    endfor
    
endfunction
