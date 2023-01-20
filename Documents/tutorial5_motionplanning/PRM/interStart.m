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
## @deftypefn {} {@var{retval} =} interStart (@var{input1}, @var{input2})
##
## @seealso{}
## @end deftypefn

## Author: borie <borie@LAPTOP-D62TNEVS>
## Created: 2023-01-20

function [connectionMatrixS] = interStart (n, L2, gap, points, x, y, S,index1, connectionMatrixC)

hold on
   connectionMatrixS = zeros(11,1);
   xplot_S = [];
   yplot_S = [];
   gap = 0.0001;

  
      for j = index1
       x_stored = points(3,j)
       y_stored = points(4,j)
##       texte = int2str(columns(points));    #Transform integer to string
##       text(x, y, texte, 'FontSize', 23); #Display the points by apperance 
        
        if (x_stored != S(1,1)) 
           
          A = (y_stored - S(2,1))/(x_stored - S(1,1));
          B = S(2,1) - A *S(1,1);
          Y = @(X) A*X+B;
          if( abs(x_stored-S(1,1))<gap && x_stored>-L2 && x_stored<L2)
             bool = 1;
             connectionMatrixS (j,n) = 1;
             connectionMatrixS (n,j) = 1;
              break;
              elseif (x_stored > S(1,1))
       
               for(g = S(1,1):gap:x_stored)
                 if(-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
        connectionMatrixS (j,n) = 1;
        connectionMatrixS (n,j) = 1;
                  break;
                 else
                  bool = 0;
                  connectionMatrixS (j,n) = 0;
        connectionMatrixS (n,j) = 0;
                endif
              endfor
      
            elseif (x_stored < S(1,1))
        
              for (g = x_stored:gap:x)
                if (-L2<g && g< L2 && -L2<Y(g) && Y(g)<L2)
                  bool = 1;
                  connectionMatrixS (j,n) = 1;
        connectionMatrixS (n,j) = 1;
                  break;
                  else
                  bool = 0;
                  connectionMatrixS (j,n) = 0;
        connectionMatrixS (n,j) = 0;
              endif
             endfor
      endif
         
          if bool == 0 &&  connectionMatrixS(j, n) == 0 && n!=j
     
       
              xplot = [S(1,1), x_stored];
              yplot = [S(2,1), y_stored];
              xyplot = [xplot; yplot];
              plot(xplot, yplot, 'o-r', 'Color', 'r');
              drawnow
            
         endif
       endif
      
    endfor
    
endfunction
