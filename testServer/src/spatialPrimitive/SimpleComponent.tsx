import { forwardRef } from "react"

export const SimpleComponent =forwardRef( (props: any, ref: any) => {
    return <div {...props} ref={ref} > this is a simple component </div>
})
