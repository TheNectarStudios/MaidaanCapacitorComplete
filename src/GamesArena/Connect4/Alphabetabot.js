//pass depth


const CELL_STATES = {
    EMPTY: 0,
    PLAYER1: 1,
    PLAYER2: 2
};

const GAME_STATES = {
    ONGOING: 0,
    WIN: 1,
    DRAW: 2
}

const num_to_win = 4;
const player_num = CELL_STATES.PLAYER2
const timeout = 1000;


var depth;

export function get_next_move(board,depth) {
    board = board;
    depth = depth;
    var move_score = 0;
    var best_move = 0;
    var best_score = Number.MIN_SAFE_INTEGER;
    var alpha = Number.MIN_SAFE_INTEGER;
    var beta = Number.MAX_SAFE_INTEGER;
    var opponent = (player_num === CELL_STATES.PLAYER1) ? CELL_STATES.PLAYER2 : CELL_STATES.PLAYER1;
    var start_time = new Date().getTime();

    //if we can win in the next move, make the move
    for(let i = 0; i < board[0].length; i++){
        if(is_winning_move(board, i, player_num)){
            // console.log(1);
            return i;
        }
    }

    //if our opponent can win in the next move, block the move
    for(let i = 0; i < board[0].length; i++){
        if(is_winning_move(board, i, opponent)){
            // console.log(1);
            return i;
        }
    }

    // use minimax with alpha beta pruning to decide on the next move
    for(var i=0; i < board[0].length && !is_timeout(start_time); ++i){
        if(can_make_move(board, i)){
            var[row, col] = make_move(board, i, player_num);
            // console.log(row,col);
            move_score = min_value(board, depth-1, player_num, alpha, beta, row, col);
            if(move_score >= best_score){
                best_score = move_score;
                best_move = i;
            }
            unmake_move(board, i);
        }
    }

    // If we haven't found a move to make, pick the first column available
    if(!can_make_move(board, best_move)) {
        best_move = 0;
        while(!can_make_move(board, best_move))
            best_move++;
    }
    return best_move;
}

/*
 * Get the best possible score for your move
 * @depth: An int representing how many more moves in advance to survey
 * @player: The current player (1 or 2)
 * @alpha: The players best score of type int
 * @beta: The opponents best score of type int
 * @row: The row where a move has been made
 * @col: the column where a move has been made
 * Return: The AI's best possible score
 */
function max_value(board, depth, player, alpha, beta, row, col) {
    var best_score = Number.MIN_SAFE_INTEGER;
    var move_score;
    var game_state = get_game_state(board, row, col, num_to_win, player);
    if(depth === 0 || game_state !== GAME_STATES.ONGOING) {
        return get_heuristic(board, player_num, game_state, player);
    }else{
        player = (player === CELL_STATES.PLAYER1) ? CELL_STATES.PLAYER2 : CELL_STATES.PLAYER1;
        for(var i=0; i < board[0].length; ++i){
            if(can_make_move(board, i)){
                var[r,c] = make_move(board, i, player);
                move_score = min_value(board, depth-1, player, alpha, beta, r, c);
                if(move_score > best_score)
                    best_score = move_score;
                unmake_move(board, i);
                if(best_score >= beta)
                    return best_score;
                if(best_score > alpha)
                    alpha = best_score;
            }
        }
    }
    return best_score;
}

/*
 * Get the worst possible score for your opponent
 * @depth: An int representing how many more moves in advance to survey
 * @player: The current player (1 or 2)
 * @alpha: The players best score of type int
 * @beta: The opponents best score of type int
 * @row: The row where a move has been made
 * @col: the column where a move has been made
 * Return: The opponents worst possible score
 */
function min_value(board, depth, player, alpha, beta, row, col) {
    var best_score = Number.MAX_SAFE_INTEGER;
    var move_score;
    var game_state = get_game_state(board, row, col, num_to_win, player);
    if(depth === 0 || game_state !== GAME_STATES.ONGOING) {
        return get_heuristic(board, player_num, game_state, player);
    }else{
        player = (player === CELL_STATES.PLAYER1) ? CELL_STATES.PLAYER2 : CELL_STATES.PLAYER1;
        for(var i=0; i < board[0].length; ++i){
            if(can_make_move(board, i)){
                var[r,c] = make_move(board, i, player);
                move_score = max_value(board, depth-1, player, alpha, beta, r, c);
                if(move_score < best_score)
                    best_score = move_score;
                unmake_move(board, i);
                if(best_score <= alpha)
                    return best_score;
                if(best_score < beta)
                    beta = best_score;
            }
        }
    }
    return best_score;
}

/*
 * Return a metric representing how favorable the current board state is
 * @our_player: An int representing the AI player (1 or 2)
 * @game_state: A 2D array representing the current state of the board
 * @last_player: The last player to make a move
 * Return: int representing how favorable the current board state is (larger is better)
 */
function get_heuristic(board, our_player, game_state, last_player) {
    if(game_state !== GAME_STATES.ONGOING)
        return (last_player === our_player) ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;

    var board_width = board[0].length;
    var board_height = board.length;
    var player1_score = 0;
    var player2_score = 0;
    var column_value = [1,2,3,4,3,2,1];
    
    for(var i=0; i < board_width; i++){
        if(board[board_height - 1][i] === CELL_STATES.EMPTY) continue;
        var height = board_height - get_column_height(board, i);
        for(var j = board_height - 1; j >= height; j--){
            //check surrounding area with a padding of 1 cell horizontally and 2 cells vertically
            for(var x = -1; x <= 1; x++){
                for(var y = -2; y <= 2; y++){
                    if(i + x < 0 || i + x >= board_width || i - x < 0 || i - x >= board_width ||
                        j + y < 0 || j + y >= board_height || j - y < 0 || j - y >= board_height){
                        continue;
                    }
                    //calculate the utility of the cell for the respective player
                    if(board[j+y][i+x] === CELL_STATES.PLAYER1){
                        if(board[j-y][i-x] === CELL_STATES.PLAYER1) {
                            player1_score += 2 * column_value[i];
                        }else{
                            player1_score += 1;
                        }
                    }else if(board[j+y][i+x] === CELL_STATES.PLAYER2){
                        if(board[j-y][i-x] === CELL_STATES.PLAYER2){
                            player2_score += 2 * column_value[i];
                        }else{
                            player2_score += 1;
                        }
                    }
                }
            }
            
        }
    }
    return (player_num === CELL_STATES.PLAYER1) ?
        (player1_score - player2_score):(player2_score - player1_score);
}




/*
 * Determine if a move will result in a win
 * @move: An int representing the column to make a move in
 * @curr_player: The current player (1 or 2)
 * Return: True if the move results in a win, False otherwise
 */
function is_winning_move(board, move, curr_player){
    if(can_make_move(board, move)){
        var[r,c] = make_move(board, move, curr_player);
        var game_state = get_game_state(board, r, c, num_to_win, curr_player);
        unmake_move(board, move);
        if(game_state === GAME_STATES.WIN)
            return true       
    }
    return false;
}

/*
 * get the number of tokens in a column
 * @col: An int representing the column number
 * Return: The int number of tokens in a column
 */
function get_column_height(board, col) {
    var height = 0;
    for(var i = board.length-1; i >= 0; --i){
        if(board[i][col] === CELL_STATES.EMPTY)
            break;
        height++;
    }
    return height;
}

/* 
 * Checks if the AI has run out of time to make a move
 * @start_time: int time in miliseconds
 * Return: True if AI has exceeded time limit, False otherwise
 */
function is_timeout(start_time) {
    return (new Date().getTime() - start_time >= timeout);
}

/*
 * Makes a move on the board at the specified column
 * @col: An int representing the column to make a move
 * @curr_player: The player making the move (1 or 2)
 * Return: int array of the form [row,col] representing where the move was made
 */
function make_move(board, col, curr_player) {
    var row = 0;
    while( row < board.length && board[row][col] === CELL_STATES.EMPTY) ++row;
    board[row - 1][col] = curr_player;
    return [row - 1, col];
     
}

/*
 * Unmakes a move at a specified column
 * @col: An int representing the column
 * Return: Nothing is returned
 */
function unmake_move(board, col) {
    var row = 0;
    while( row < board.length && board[row][col] === CELL_STATES.EMPTY) ++row;
    board[row][col] = CELL_STATES.EMPTY;
}

/*
 * Determines if a move can be made at a specified column
 * @col: An int representing the column
 * Return: True if a move can be made in the column, false otherwise
 */
function can_make_move(board, col) {
    return board[0][col] === CELL_STATES.EMPTY;
}


function transpose(board, matrix) {
    return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
}

function is_valid_move(matrix, column) {
    return matrix[0][column] === CELL_STATES.EMPTY;
}


function check_left_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player){
    var num_consecutive = 1;
    //check top left diagonal
    for(let i = 1; row - i >= 0 && col - i >= 0; i++){
      if(board[row-i][col-i] === curr_player)
        num_consecutive += 1;
      else
        break;
    }
    //check bottom right diagonal
    for(let i = 1; row + i < num_rows && col + i < num_cols; i++){
      if(board[row+i][col+i] === curr_player)
        num_consecutive += 1;
      else
        break;
    }
    return (num_consecutive >= num_to_win)
}

function check_vertical(board, row, col, num_rows, num_to_win, curr_player){
    var num_consecutive = 1;
    //check bottom vertical
    for(var i = 1; row + i < num_rows; i++){
        if(board[row+i][col] === curr_player)
            num_consecutive += 1;
        else
            break;
    }
    return (num_consecutive >= num_to_win);
}

function check_right_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player){
    var num_consecutive = 1;
    //check top right diagonal
    for(let i = 1; row - i >= 0 && col + i < num_cols; i++){
        if(board[row-i][col+i] === curr_player)
            num_consecutive += 1;
        else
            break;
    }
    //check bottom left diagonal
    for(let i = 1; row + i < num_rows && col - i >= 0; i++){
        if(board[row+i][col-i] === curr_player)
            num_consecutive += 1;
        else
            break;
    }
    return (num_consecutive >= num_to_win);
}

function check_horizontal(board, row, col, num_cols, num_to_win, curr_player){
    var num_consecutive = 1;
    //check right horizontal
    for(let i = 1; col + i < num_cols; i++){
        if(board[row][col+i] === curr_player)
            num_consecutive += 1;
        else
            break;
    }
    //check left horizontal
    for(let i = 1; col - i >= 0; i++){
        if(board[row][col-i] === curr_player)
            num_consecutive += 1;
        else
            break;
    }
    return (num_consecutive >= num_to_win);
}

function board_is_full(matrix) {
    for(let j = 0; j < matrix[0].length; ++j){
        if(matrix[0][j] === CELL_STATES.EMPTY)
            return false
    }
    return true
}

function get_game_state(board, row, col, num_to_win, curr_player) {
    var num_rows = board.length;
    var num_cols = board[0].length;
    var someone_won = (check_left_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player) ||
        check_vertical(board, row, col, num_rows, num_to_win, curr_player) ||
        check_right_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player)||
        check_horizontal(board, row, col, num_cols, num_to_win, curr_player));

    if(someone_won)
        return GAME_STATES.WIN;
    if(board_is_full(board))
        return GAME_STATES.DRAW;
    return GAME_STATES.ONGOING;
}


function make_copy(board){
    var copy = [];
      for (var i = 0; i < board.length; i++)
          copy[i] = board[i].slice();
    return copy;
}

function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(ms)
        }, ms )
    })
}

function get_winning_move(board, row, col, num_to_win, curr_player) {
    var num_rows = board.length;
    var num_cols = board[0].length;
    var left_diagonal = get_left_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player);
    if(left_diagonal)
        return left_diagonal;

    var vertical = get_vertical(board, row, col, num_rows, num_to_win, curr_player);
    if(vertical)
        return vertical;

    var right_diagonal = get_right_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player);
    if(right_diagonal)
        return right_diagonal;

    var horizontal = get_horizontal(board, row, col, num_cols, num_to_win, curr_player);
    if(horizontal)
        return horizontal;
    //return null if there were no winning moves to be found
    return null;
}
/*
 * Returns the winning moves (array of [row, column] coordinate pairs) of the left diagonal if they exist.
 * If there is no winning move, null is returned.
 */
function get_left_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player){
    var winning_moves = [[row,col]];
    var num_consecutive = 1;
    //check top left diagonal
    for(let i = 1; row - i >= 0 && col - i >= 0; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row-i][col-i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row-i,col-i])
        }else{
            break;
        } 
            
    }

    if(num_consecutive === num_to_win)
        return winning_moves;

    //check bottom right diagonal
    for(let i = 1; row + i < num_rows && col + i < num_cols; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row+i][col+i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row+i,col+i])
        }else{
            break;
        }
            
    }

    if(num_consecutive === num_to_win)
        return winning_moves;
    return null;
}

function get_vertical(board, row, col, num_rows, num_to_win, curr_player){
    var winning_moves = [[row,col]];
    var num_consecutive = 1;
    //check bottom vertical
    for(var i = 1; row + i < num_rows; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row+i][col] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row+i,col]);
        }else{
            break;
        }
            
    }
    if(num_consecutive === num_to_win)
            return winning_moves;
    return null;
}

function get_right_diagonal(board, row, col, num_rows, num_cols, num_to_win, curr_player){
    var winning_moves = [[row,col]];
    var num_consecutive = 1;
    //check top right diagonal
    for(let i = 1; row - i >= 0 && col + i < num_cols; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row-i][col+i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row-i,col+i]);
        }else{
            break;
        }  
    }

    if(num_consecutive === num_to_win)
            return winning_moves;

    //check bottom left diagonal
    for(let i = 1; row + i < num_rows && col - i >= 0; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row+i][col-i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row+i,col-i]);
        }else
            break;
    }
    if(num_consecutive === num_to_win)
            return winning_moves;
    return null;
}

function get_horizontal(board, row, col, num_cols, num_to_win, curr_player){
    var winning_moves = [[row,col]];
    var num_consecutive = 1;
    //check right horizontal
    for(let i = 1; col + i < num_cols; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row][col+i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row,col+i]);
        }else
            break;
    }

    if(num_consecutive === num_to_win)
            return winning_moves;

    //check left horizontal
    for(let i = 1; col - i >= 0; i++){
        if(num_consecutive === num_to_win)
            return winning_moves;
        if(board[row][col-i] === curr_player){
            num_consecutive += 1;
            winning_moves.push([row,col-i]);
        }else
            break;
    }
    if(num_consecutive === num_to_win)
            return winning_moves;
    return null;
}
