export const openKeyBoard = (data) =>{
    return {
        ...data,
        type: 'OPEN_KEYBOARD'
    }
}
export const openModal = (data) =>{
    return {
        ...data,
        type: 'OPEN_MODAL'
    }
}

export const gameStarted = (data) =>{
    return {
        ...data,
        type: 'GAME_STARTED'
    }
}