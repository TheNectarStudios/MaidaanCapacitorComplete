const initialState = {
    openKeyboard: false,
    gameStarted: false
}
export const handleReducer = (state=initialState, action) =>{
    switch (action.type){
        case 'OPEN_MODAL': {
            return {
                ...state,
                openKeyboard: action.openKeyboard
            }
        }
        case 'GAME_STARTED': {
            return {
                ...state,
                gameStarted: action.gameStarted
            }
        }
        case 'OPEN_KEYBOARD': {
            return {
                ...state,
                openKeyboard: action.openKeyboard
            }
        }
        case 'default': {
            return {...state}
        }
    }
}